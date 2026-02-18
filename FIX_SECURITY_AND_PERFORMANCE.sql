-- =====================================================================
-- ISLANDLOAF VENDOR PLATFORM - SECURITY & PERFORMANCE FIX
-- Run this in Supabase SQL Editor. Safe to run multiple times.
-- =====================================================================

-- FIX 0014: MOVE EXTENSIONS OUT OF PUBLIC SCHEMA
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        ALTER EXTENSION "pgcrypto" SET SCHEMA extensions;
    END IF;
END;
$$;

GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- FIX 0001 + 0013: INDEXES + RLS (all dynamic, skips missing tables)
DO $$
DECLARE
    tbl TEXT;
    tbl_list TEXT[] := ARRAY[
        'users','services','bookings','calendar_sources','calendar_events',
        'stripe_connect_accounts','vendor_payouts','transactions','commissions',
        'pricing_rules','reviews','marketing_contents','notifications','messages',
        'support_tickets','service_views','search_queries','platform_settings',
        'activity_logs','api_keys','room_types','booking_rooms',
        'agent_identities','agent_tasks','agent_audit_logs','agent_idempotency_keys'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbl_list LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        END IF;
    END LOOP;

    -- Missing FK indexes (dynamic so missing tables are skipped)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='calendar_events') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_source_id ON calendar_events(calendar_source_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_calendar_events_booking_id ON calendar_events(booking_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='commissions') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_commissions_payout_id ON commissions(payout_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pricing_rules') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pricing_rules_service_id ON pricing_rules(service_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='marketing_contents') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_marketing_contents_user_id ON marketing_contents(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_marketing_contents_service_id ON marketing_contents(service_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='support_tickets') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='service_views') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_service_views_user_id ON service_views(user_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='search_queries') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_search_queries_clicked_service_id ON search_queries(clicked_service_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_settings') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON platform_settings(updated_by)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_logs') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='room_types') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_room_types_vendor_id ON room_types(vendor_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='booking_rooms') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_booking_rooms_booking_id ON booking_rooms(booking_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_booking_rooms_room_type_id ON booking_rooms(room_type_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agent_tasks') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_by_agent_id ON agent_tasks(created_by_agent_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agent_idempotency_keys') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_agent_idempotency_keys_agent_id ON agent_idempotency_keys(agent_id)';
    END IF;
END;
$$;

-- FIX 0011: SET SEARCH_PATH ON ALL FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        NEW.booking_reference = 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION calculate_booking_financials()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE vendor_commission_rate DECIMAL(5,2);
BEGIN
    SELECT commission_rate INTO vendor_commission_rate FROM public.users WHERE id = NEW.user_id;
    IF vendor_commission_rate IS NOT NULL THEN
        NEW.commission = NEW.total_price * (vendor_commission_rate / 100);
        NEW.vendor_payout = NEW.total_price - NEW.commission;
    ELSE
        NEW.commission = NEW.total_price * 0.125;
        NEW.vendor_payout = NEW.total_price - NEW.commission;
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    UPDATE public.services
    SET rating = (SELECT AVG(rating) FROM public.reviews WHERE service_id = NEW.service_id),
        reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE service_id = NEW.service_id)
    WHERE id = NEW.service_id;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION create_commission_record()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid' THEN
        INSERT INTO public.commissions (booking_id, user_id, booking_amount, commission_rate, commission_amount, vendor_payout_amount, status)
        VALUES (NEW.id, NEW.user_id, NEW.total_price,
            COALESCE((SELECT commission_rate FROM public.users WHERE id = NEW.user_id), 12.5),
            NEW.commission, NEW.vendor_payout, 'pending')
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END; $$;

-- RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SET search_path = '' AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::integer AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS INTEGER LANGUAGE sql STABLE SET search_path = '' AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::integer;
$$;

-- RLS POLICIES (all dynamic SQL so missing tables are safely skipped)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can view own data" ON users';
    EXECUTE 'CREATE POLICY "Vendors can view own data" ON users FOR SELECT USING (id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage users" ON users';
    EXECUTE 'CREATE POLICY "Admins can manage users" ON users FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON users';
    EXECUTE 'CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = current_app_user_id()) WITH CHECK (id = current_app_user_id())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='services') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view available services" ON services';
    EXECUTE 'CREATE POLICY "Public can view available services" ON services FOR SELECT USING (available = true)';
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can manage own services" ON services';
    EXECUTE 'CREATE POLICY "Vendors can manage own services" ON services FOR ALL USING (user_id = current_app_user_id() OR is_admin()) WITH CHECK (user_id = current_app_user_id() OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can view own bookings" ON bookings';
    EXECUTE 'CREATE POLICY "Vendors can view own bookings" ON bookings FOR SELECT USING (user_id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings';
    EXECUTE 'CREATE POLICY "Anyone can create bookings" ON bookings FOR INSERT WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Vendors and admins can update bookings" ON bookings';
    EXECUTE 'CREATE POLICY "Vendors and admins can update bookings" ON bookings FOR UPDATE USING (user_id = current_app_user_id() OR is_admin()) WITH CHECK (user_id = current_app_user_id() OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='calendar_sources') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can manage own calendar sources" ON calendar_sources';
    EXECUTE 'CREATE POLICY "Vendors can manage own calendar sources" ON calendar_sources FOR ALL USING (user_id = current_app_user_id() OR is_admin()) WITH CHECK (user_id = current_app_user_id() OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='calendar_events') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can manage own calendar events" ON calendar_events';
    EXECUTE 'CREATE POLICY "Vendors can manage own calendar events" ON calendar_events FOR ALL USING (user_id = current_app_user_id() OR is_admin()) WITH CHECK (user_id = current_app_user_id() OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stripe_connect_accounts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can view own stripe account" ON stripe_connect_accounts';
    EXECUTE 'CREATE POLICY "Vendors can view own stripe account" ON stripe_connect_accounts FOR SELECT USING (user_id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage stripe accounts" ON stripe_connect_accounts';
    EXECUTE 'CREATE POLICY "Admins can manage stripe accounts" ON stripe_connect_accounts FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vendor_payouts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can view own payouts" ON vendor_payouts';
    EXECUTE 'CREATE POLICY "Vendors can view own payouts" ON vendor_payouts FOR SELECT USING (user_id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage payouts" ON vendor_payouts';
    EXECUTE 'CREATE POLICY "Admins can manage payouts" ON vendor_payouts FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transactions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can view own transactions" ON transactions';
    EXECUTE 'CREATE POLICY "Vendors can view own transactions" ON transactions FOR SELECT USING (user_id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage transactions" ON transactions';
    EXECUTE 'CREATE POLICY "Admins can manage transactions" ON transactions FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='commissions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can view own commissions" ON commissions';
    EXECUTE 'CREATE POLICY "Vendors can view own commissions" ON commissions FOR SELECT USING (user_id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage commissions" ON commissions';
    EXECUTE 'CREATE POLICY "Admins can manage commissions" ON commissions FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pricing_rules') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can manage own pricing rules" ON pricing_rules';
    EXECUTE 'CREATE POLICY "Vendors can manage own pricing rules" ON pricing_rules FOR ALL USING (service_id IN (SELECT id FROM public.services WHERE user_id = current_app_user_id()) OR is_admin()) WITH CHECK (service_id IN (SELECT id FROM public.services WHERE user_id = current_app_user_id()) OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reviews') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view public reviews" ON reviews';
    EXECUTE 'CREATE POLICY "Public can view public reviews" ON reviews FOR SELECT USING (is_public = true)';
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can view own reviews" ON reviews';
    EXECUTE 'CREATE POLICY "Vendors can view own reviews" ON reviews FOR SELECT USING (user_id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can create reviews" ON reviews';
    EXECUTE 'CREATE POLICY "Anyone can create reviews" ON reviews FOR INSERT WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can respond to reviews" ON reviews';
    EXECUTE 'CREATE POLICY "Vendors can respond to reviews" ON reviews FOR UPDATE USING (user_id = current_app_user_id() OR is_admin()) WITH CHECK (user_id = current_app_user_id() OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='marketing_contents') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can manage own marketing content" ON marketing_contents';
    EXECUTE 'CREATE POLICY "Vendors can manage own marketing content" ON marketing_contents FOR ALL USING (user_id = current_app_user_id() OR is_admin()) WITH CHECK (user_id = current_app_user_id() OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own notifications" ON notifications';
    EXECUTE 'CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own notifications" ON notifications';
    EXECUTE 'CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "System can create notifications" ON notifications';
    EXECUTE 'CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own messages" ON messages';
    EXECUTE 'CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (recipient_id = current_app_user_id() OR sender_id = current_app_user_id() OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can send messages" ON messages';
    EXECUTE 'CREATE POLICY "Anyone can send messages" ON messages FOR INSERT WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Recipients can update messages" ON messages';
    EXECUTE 'CREATE POLICY "Recipients can update messages" ON messages FOR UPDATE USING (recipient_id = current_app_user_id() OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='support_tickets') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own tickets" ON support_tickets';
    EXECUTE 'CREATE POLICY "Users can manage own tickets" ON support_tickets FOR ALL USING (user_id = current_app_user_id() OR is_admin()) WITH CHECK (user_id = current_app_user_id() OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='service_views') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can log service views" ON service_views';
    EXECUTE 'CREATE POLICY "Anyone can log service views" ON service_views FOR INSERT WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can view own service analytics" ON service_views';
    EXECUTE 'CREATE POLICY "Vendors can view own service analytics" ON service_views FOR SELECT USING (service_id IN (SELECT id FROM public.services WHERE user_id = current_app_user_id()) OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='search_queries') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can log search queries" ON search_queries';
    EXECUTE 'CREATE POLICY "Anyone can log search queries" ON search_queries FOR INSERT WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view search analytics" ON search_queries';
    EXECUTE 'CREATE POLICY "Admins can view search analytics" ON search_queries FOR SELECT USING (is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public settings are readable" ON platform_settings';
    EXECUTE 'CREATE POLICY "Public settings are readable" ON platform_settings FOR SELECT USING (is_public = true OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage settings" ON platform_settings';
    EXECUTE 'CREATE POLICY "Admins can manage settings" ON platform_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs';
    EXECUTE 'CREATE POLICY "Admins can view activity logs" ON activity_logs FOR SELECT USING (is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "System can create activity logs" ON activity_logs';
    EXECUTE 'CREATE POLICY "System can create activity logs" ON activity_logs FOR INSERT WITH CHECK (true)';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='api_keys') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage api keys" ON api_keys';
    EXECUTE 'CREATE POLICY "Admins can manage api keys" ON api_keys FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='room_types') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can manage own room types" ON room_types';
    EXECUTE 'CREATE POLICY "Vendors can manage own room types" ON room_types FOR ALL USING (vendor_id = current_app_user_id() OR is_admin()) WITH CHECK (vendor_id = current_app_user_id() OR is_admin())';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='booking_rooms') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Vendors can view own booking rooms" ON booking_rooms';
    EXECUTE 'CREATE POLICY "Vendors can view own booking rooms" ON booking_rooms FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = current_app_user_id()) OR is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can create booking rooms" ON booking_rooms';
    EXECUTE 'CREATE POLICY "Anyone can create booking rooms" ON booking_rooms FOR INSERT WITH CHECK (true)';
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agent_identities') THEN
    EXECUTE 'DROP POLICY IF EXISTS "No direct access to agent identities" ON agent_identities';
    EXECUTE 'CREATE POLICY "No direct access to agent identities" ON agent_identities FOR ALL USING (false)';
END IF;
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agent_tasks') THEN
    EXECUTE 'DROP POLICY IF EXISTS "No direct access to agent tasks" ON agent_tasks';
    EXECUTE 'CREATE POLICY "No direct access to agent tasks" ON agent_tasks FOR ALL USING (false)';
END IF;
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agent_audit_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "No direct access to agent audit logs" ON agent_audit_logs';
    EXECUTE 'CREATE POLICY "No direct access to agent audit logs" ON agent_audit_logs FOR ALL USING (false)';
END IF;
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agent_idempotency_keys') THEN
    EXECUTE 'DROP POLICY IF EXISTS "No direct access to agent idempotency keys" ON agent_idempotency_keys';
    EXECUTE 'CREATE POLICY "No direct access to agent idempotency keys" ON agent_idempotency_keys FOR ALL USING (false)';
END IF;
END $$;

-- VERIFY
SELECT 'SECURITY & PERFORMANCE FIXES APPLIED' as status,
       (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as rls_policies_count,
       (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes_count,
       NOW() as applied_at;
