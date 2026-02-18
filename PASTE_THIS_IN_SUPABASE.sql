-- ISLANDLOAF VENDOR PLATFORM - COMPLETE DATABASE SETUP
-- Paste this ENTIRE script into Supabase SQL Editor and click Run
-- It will create ALL tables, functions, triggers, indexes, users, and settings

-- Step 1: Enable required extensions (in dedicated schema, not public)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- =====================
-- CORE TABLES
-- =====================

-- Users Table (Vendors & Admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Sri Lanka',
  role TEXT NOT NULL DEFAULT 'vendor',
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stripe_connected_account_id VARCHAR(255),
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  profile_image VARCHAR(500),
  commission_rate DECIMAL(5, 2) DEFAULT 12.5,
  categories_allowed JSONB DEFAULT '["stays", "transport", "tours"]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  base_price REAL NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  available BOOLEAN DEFAULT true,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  images TEXT[],
  amenities TEXT[],
  max_capacity INTEGER,
  min_booking_days INTEGER DEFAULT 1,
  cancellation_policy TEXT,
  house_rules TEXT,
  check_in_time TIME,
  check_out_time TIME,
  instant_booking BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_reference VARCHAR(50) UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_country VARCHAR(100),
  guests_count INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  nights_count INTEGER,
  total_price REAL NOT NULL,
  commission REAL DEFAULT 0,
  vendor_payout DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  special_requests TEXT,
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  refund_amount DECIMAL(10, 2) DEFAULT 0,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Calendar Sources Table
CREATE TABLE IF NOT EXISTS calendar_sources (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  last_synced TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'active',
  error_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  calendar_source_id INTEGER REFERENCES calendar_sources(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  title TEXT NOT NULL,
  summary VARCHAR(255),
  description TEXT,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  is_pending BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN DEFAULT true,
  event_type VARCHAR(50) DEFAULT 'booking',
  source TEXT DEFAULT 'direct',
  external_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- STRIPE & PAYMENTS
-- =====================

-- Stripe Connect Accounts Table
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  country VARCHAR(2) NOT NULL,
  email VARCHAR(255),
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  default_currency VARCHAR(3) DEFAULT 'USD',
  business_profile JSONB,
  requirements JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor Payouts Table
CREATE TABLE IF NOT EXISTS vendor_payouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  stripe_payout_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  payout_date DATE,
  booking_ids INTEGER[],
  failure_reason TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  user_id INTEGER REFERENCES users(id),
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_refund_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Commission Tracking Table
CREATE TABLE IF NOT EXISTS commissions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  booking_amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  vendor_payout_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP,
  payout_id INTEGER REFERENCES vendor_payouts(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- AI AGENT TABLES
-- =====================

-- Agent Identities
CREATE TABLE IF NOT EXISTS agent_identities (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  request_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent Tasks
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  created_by_agent_id UUID REFERENCES agent_identities(id),
  assigned_to_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  priority INTEGER DEFAULT 5,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Agent Audit Logs
CREATE TABLE IF NOT EXISTS agent_audit_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  agent_id UUID REFERENCES agent_identities(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  request_body JSONB,
  result_body JSONB,
  status TEXT NOT NULL,
  idempotency_key TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent Idempotency Keys
CREATE TABLE IF NOT EXISTS agent_idempotency_keys (
  key TEXT PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agent_identities(id),
  result_body JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- =====================
-- PRICING & MARKETING
-- =====================

-- Pricing Rules Table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  multiplier DECIMAL(5, 2) DEFAULT 1.0,
  fixed_adjustment DECIMAL(10, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  days_of_week INTEGER[],
  min_nights INTEGER,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  customer_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  comment TEXT,
  response TEXT,
  response_date TIMESTAMP,
  is_public BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Content Table
CREATE TABLE IF NOT EXISTS marketing_contents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  service_id INTEGER REFERENCES services(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  service_description TEXT,
  target_audience TEXT,
  tone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- NOTIFICATIONS & MESSAGING
-- =====================

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  category VARCHAR(50),
  read BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  action_text VARCHAR(100),
  image_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  sender_type VARCHAR(20) NOT NULL,
  sender_id INTEGER,
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255),
  recipient_id INTEGER REFERENCES users(id),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  vendor_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL,
  assigned_to TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- ANALYTICS & CONFIG
-- =====================

-- Service Views Tracking
CREATE TABLE IF NOT EXISTS service_views (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(500),
  country VARCHAR(100),
  city VARCHAR(100),
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Search Queries
CREATE TABLE IF NOT EXISTS search_queries (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  clicked_service_id INTEGER REFERENCES services(id),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  data_type VARCHAR(50) DEFAULT 'json',
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Room Types Table
CREATE TABLE IF NOT EXISTS room_types (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES users(id),
  room_type_name TEXT NOT NULL,
  bed_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  number_of_rooms INTEGER NOT NULL,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  price_modifier REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Booking Rooms Table
CREATE TABLE IF NOT EXISTS booking_rooms (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  room_type_id INTEGER NOT NULL REFERENCES room_types(id),
  rooms_booked INTEGER NOT NULL DEFAULT 1,
  guest_count INTEGER NOT NULL DEFAULT 1,
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- PERFORMANCE INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_type ON services(type);
CREATE INDEX IF NOT EXISTS idx_services_available ON services(available);
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location);
CREATE INDEX IF NOT EXISTS idx_services_rating ON services(rating DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_sources_user_id ON calendar_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sources_service_id ON calendar_sources(service_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_service_id ON calendar_events(service_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_id ON stripe_connect_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_user_id ON vendor_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON vendor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_commissions_booking_id ON commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_agent_identities_role ON agent_identities(role);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created ON agent_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_audit_agent_id ON agent_audit_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_audit_created ON agent_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_service_views_service_id ON service_views(service_id);
CREATE INDEX IF NOT EXISTS idx_service_views_viewed_at ON service_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_source_id ON calendar_events(calendar_source_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_booking_id ON calendar_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payout_id ON commissions(payout_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_service_id ON pricing_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_marketing_contents_user_id ON marketing_contents(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_contents_service_id ON marketing_contents(service_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_service_views_user_id ON service_views(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_clicked_service_id ON search_queries(clicked_service_id);
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON platform_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_room_types_vendor_id ON room_types(vendor_id);
CREATE INDEX IF NOT EXISTS idx_booking_rooms_booking_id ON booking_rooms(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_rooms_room_type_id ON booking_rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_by_agent_id ON agent_tasks(created_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_idempotency_keys_agent_id ON agent_idempotency_keys(agent_id);

-- =====================
-- FUNCTIONS & TRIGGERS
-- =====================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        NEW.booking_reference = 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_booking_reference ON bookings;
CREATE TRIGGER set_booking_reference BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();

-- Function: Calculate commission and vendor payout
CREATE OR REPLACE FUNCTION calculate_booking_financials()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    vendor_commission_rate DECIMAL(5,2);
BEGIN
    SELECT commission_rate INTO vendor_commission_rate
    FROM public.users WHERE id = NEW.user_id;

    IF vendor_commission_rate IS NOT NULL THEN
        NEW.commission = NEW.total_price * (vendor_commission_rate / 100);
        NEW.vendor_payout = NEW.total_price - NEW.commission;
    ELSE
        NEW.commission = NEW.total_price * 0.125;
        NEW.vendor_payout = NEW.total_price - NEW.commission;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_booking_financials_trigger ON bookings;
CREATE TRIGGER calculate_booking_financials_trigger
  BEFORE INSERT OR UPDATE OF total_price ON bookings
  FOR EACH ROW EXECUTE FUNCTION calculate_booking_financials();

-- Function: Update service rating from reviews
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    UPDATE public.services
    SET rating = (SELECT AVG(rating) FROM public.reviews WHERE service_id = NEW.service_id),
        reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE service_id = NEW.service_id)
    WHERE id = NEW.service_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_service_rating_trigger ON reviews;
CREATE TRIGGER update_service_rating_trigger AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_service_rating();

-- Function: Create commission record on confirmed+paid booking
CREATE OR REPLACE FUNCTION create_commission_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid' THEN
        INSERT INTO public.commissions (
            booking_id, user_id, booking_amount, commission_rate,
            commission_amount, vendor_payout_amount, status
        ) VALUES (
            NEW.id, NEW.user_id, NEW.total_price,
            COALESCE((SELECT commission_rate FROM public.users WHERE id = NEW.user_id), 12.5),
            NEW.commission, NEW.vendor_payout, 'pending'
        ) ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_commission_trigger ON bookings;
CREATE TRIGGER create_commission_trigger AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_commission_record();

-- =====================
-- DEFAULT PLATFORM SETTINGS
-- =====================

INSERT INTO platform_settings (key, value, description, is_public) VALUES
  ('default_commission', '{"percentage": 12.5}'::jsonb, 'Default commission rate for new vendors', false),
  ('payout_schedule', '{"frequency": "weekly", "day": "friday"}'::jsonb, 'Vendor payout schedule', false),
  ('platform_email', '{"email": "info@islandloafvendor.com"}'::jsonb, 'Platform contact email', true),
  ('platform_name', '{"name": "IslandLoaf"}'::jsonb, 'Platform name', true),
  ('currency', '{"default": "USD", "supported": ["USD", "LKR", "EUR", "GBP"]}'::jsonb, 'Supported currencies', true),
  ('booking_hold_days', '{"days": 7}'::jsonb, 'Days to hold commission before payout', false),
  ('min_payout_amount', '{"amount": 50}'::jsonb, 'Minimum payout amount in USD', false),
  ('commission_tiers', '{"standard": 12.5, "premium": 10, "new": 15}'::jsonb, 'Commission rate tiers', false)
ON CONFLICT (key) DO NOTHING;

-- =====================
-- REPORTING VIEWS
-- =====================

-- Vendor Dashboard Summary
CREATE OR REPLACE VIEW vendor_dashboard_summary AS
SELECT
    u.id as vendor_id,
    u.business_name,
    COUNT(DISTINCT s.id) as total_services,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.vendor_payout ELSE 0 END), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.commission ELSE 0 END), 0) as total_commission_paid,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews
FROM users u
LEFT JOIN services s ON u.id = s.user_id
LEFT JOIN bookings b ON u.id = b.user_id
LEFT JOIN reviews r ON u.id = r.user_id
WHERE u.role = 'vendor'
GROUP BY u.id, u.business_name;

-- Admin Platform Summary
CREATE OR REPLACE VIEW platform_summary AS
SELECT
    COUNT(DISTINCT u.id) as total_vendors,
    COUNT(DISTINCT CASE WHEN u.is_approved THEN u.id END) as approved_vendors,
    COUNT(DISTINCT CASE WHEN NOT u.is_approved THEN u.id END) as pending_vendors,
    COUNT(DISTINCT s.id) as total_services,
    COUNT(DISTINCT b.id) as total_bookings,
    COALESCE(SUM(b.total_price), 0) as total_booking_value,
    COALESCE(SUM(b.commission), 0) as total_commission_earned,
    COALESCE(SUM(b.vendor_payout), 0) as total_vendor_payouts,
    COUNT(DISTINCT r.id) as total_reviews,
    COALESCE(AVG(r.rating), 0) as platform_average_rating
FROM users u
LEFT JOIN services s ON u.id = s.user_id
LEFT JOIN bookings b ON u.id = b.user_id
LEFT JOIN reviews r ON s.id = r.service_id
WHERE u.role = 'vendor';

-- =====================
-- CREATE DEFAULT USERS
-- =====================

-- Admin user (password: AdminPass123!)
-- bcrypt hash for AdminPass123!
INSERT INTO users (username, email, password, full_name, business_name, business_type, role, is_approved, is_active, commission_rate)
VALUES (
  'admin',
  'admin@islandloaf.com',
  extensions.crypt('AdminPass123!', extensions.gen_salt('bf', 10)),
  'Admin User',
  'IslandLoaf Admin',
  'stays',
  'admin',
  true,
  true,
  0
) ON CONFLICT (email) DO NOTHING;

-- Vendor user (password: VendorPass123!)
INSERT INTO users (username, email, password, full_name, business_name, business_type, role, is_approved, is_active, commission_rate, categories_allowed)
VALUES (
  'vendor',
  'vendor@islandloaf.com',
  extensions.crypt('VendorPass123!', extensions.gen_salt('bf', 10)),
  'Island Vendor',
  'Beach Paradise Villa',
  'stays',
  'vendor',
  true,
  true,
  12.5,
  '["stays", "tours", "wellness"]'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on every public table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Helper: check if current session user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::integer
          AND role = 'admin'
    );
$$;

-- Helper: get current user id from session
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::integer;
$$;

-- USERS
CREATE POLICY "Vendors can view own data" ON users
    FOR SELECT USING (id = current_app_user_id() OR is_admin());
CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = current_app_user_id()) WITH CHECK (id = current_app_user_id());

-- SERVICES
CREATE POLICY "Public can view available services" ON services
    FOR SELECT USING (available = true);
CREATE POLICY "Vendors can manage own services" ON services
    FOR ALL USING (user_id = current_app_user_id() OR is_admin())
    WITH CHECK (user_id = current_app_user_id() OR is_admin());

-- BOOKINGS
CREATE POLICY "Vendors can view own bookings" ON bookings
    FOR SELECT USING (user_id = current_app_user_id() OR is_admin());
CREATE POLICY "Anyone can create bookings" ON bookings
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Vendors and admins can update bookings" ON bookings
    FOR UPDATE USING (user_id = current_app_user_id() OR is_admin())
    WITH CHECK (user_id = current_app_user_id() OR is_admin());

-- CALENDAR SOURCES
CREATE POLICY "Vendors can manage own calendar sources" ON calendar_sources
    FOR ALL USING (user_id = current_app_user_id() OR is_admin())
    WITH CHECK (user_id = current_app_user_id() OR is_admin());

-- CALENDAR EVENTS
CREATE POLICY "Vendors can manage own calendar events" ON calendar_events
    FOR ALL USING (user_id = current_app_user_id() OR is_admin())
    WITH CHECK (user_id = current_app_user_id() OR is_admin());

-- STRIPE CONNECT ACCOUNTS
CREATE POLICY "Vendors can view own stripe account" ON stripe_connect_accounts
    FOR SELECT USING (user_id = current_app_user_id() OR is_admin());
CREATE POLICY "Admins can manage stripe accounts" ON stripe_connect_accounts
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- VENDOR PAYOUTS
CREATE POLICY "Vendors can view own payouts" ON vendor_payouts
    FOR SELECT USING (user_id = current_app_user_id() OR is_admin());
CREATE POLICY "Admins can manage payouts" ON vendor_payouts
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- TRANSACTIONS
CREATE POLICY "Vendors can view own transactions" ON transactions
    FOR SELECT USING (user_id = current_app_user_id() OR is_admin());
CREATE POLICY "Admins can manage transactions" ON transactions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- COMMISSIONS
CREATE POLICY "Vendors can view own commissions" ON commissions
    FOR SELECT USING (user_id = current_app_user_id() OR is_admin());
CREATE POLICY "Admins can manage commissions" ON commissions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- PRICING RULES
CREATE POLICY "Vendors can manage own pricing rules" ON pricing_rules
    FOR ALL USING (
        service_id IN (SELECT id FROM public.services WHERE user_id = current_app_user_id())
        OR is_admin()
    )
    WITH CHECK (
        service_id IN (SELECT id FROM public.services WHERE user_id = current_app_user_id())
        OR is_admin()
    );

-- REVIEWS
CREATE POLICY "Public can view public reviews" ON reviews
    FOR SELECT USING (is_public = true);
CREATE POLICY "Vendors can view own reviews" ON reviews
    FOR SELECT USING (user_id = current_app_user_id() OR is_admin());
CREATE POLICY "Anyone can create reviews" ON reviews
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Vendors can respond to reviews" ON reviews
    FOR UPDATE USING (user_id = current_app_user_id() OR is_admin())
    WITH CHECK (user_id = current_app_user_id() OR is_admin());

-- MARKETING CONTENTS
CREATE POLICY "Vendors can manage own marketing content" ON marketing_contents
    FOR ALL USING (user_id = current_app_user_id() OR is_admin())
    WITH CHECK (user_id = current_app_user_id() OR is_admin());

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = current_app_user_id() OR is_admin());
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = current_app_user_id() OR is_admin());
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (is_admin());

-- MESSAGES
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (
        recipient_id = current_app_user_id()
        OR sender_id = current_app_user_id()
        OR is_admin()
    );
CREATE POLICY "Anyone can send messages" ON messages
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Recipients can update messages" ON messages
    FOR UPDATE USING (recipient_id = current_app_user_id() OR is_admin());

-- SUPPORT TICKETS
CREATE POLICY "Users can manage own tickets" ON support_tickets
    FOR ALL USING (user_id = current_app_user_id() OR is_admin())
    WITH CHECK (user_id = current_app_user_id() OR is_admin());

-- SERVICE VIEWS
CREATE POLICY "Anyone can log service views" ON service_views
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Vendors can view own service analytics" ON service_views
    FOR SELECT USING (
        service_id IN (SELECT id FROM public.services WHERE user_id = current_app_user_id())
        OR is_admin()
    );

-- SEARCH QUERIES
CREATE POLICY "Anyone can log search queries" ON search_queries
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view search analytics" ON search_queries
    FOR SELECT USING (is_admin());

-- PLATFORM SETTINGS
CREATE POLICY "Public settings are readable" ON platform_settings
    FOR SELECT USING (is_public = true OR is_admin());
CREATE POLICY "Admins can manage settings" ON platform_settings
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ACTIVITY LOGS
CREATE POLICY "Admins can view activity logs" ON activity_logs
    FOR SELECT USING (is_admin());
CREATE POLICY "System can create activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- API KEYS
CREATE POLICY "Admins can manage api keys" ON api_keys
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ROOM TYPES
CREATE POLICY "Vendors can manage own room types" ON room_types
    FOR ALL USING (vendor_id = current_app_user_id() OR is_admin())
    WITH CHECK (vendor_id = current_app_user_id() OR is_admin());

-- BOOKING ROOMS
CREATE POLICY "Vendors can view own booking rooms" ON booking_rooms
    FOR SELECT USING (
        booking_id IN (SELECT id FROM public.bookings WHERE user_id = current_app_user_id())
        OR is_admin()
    );
CREATE POLICY "Anyone can create booking rooms" ON booking_rooms
    FOR INSERT WITH CHECK (true);

-- AGENT TABLES (service_role only - block anon/authenticated)
CREATE POLICY "No direct access to agent identities" ON agent_identities
    FOR ALL USING (false);
CREATE POLICY "No direct access to agent tasks" ON agent_tasks
    FOR ALL USING (false);
CREATE POLICY "No direct access to agent audit logs" ON agent_audit_logs
    FOR ALL USING (false);
CREATE POLICY "No direct access to agent idempotency keys" ON agent_idempotency_keys
    FOR ALL USING (false);

-- =====================
-- VERIFY SETUP
-- =====================

SELECT 'SUCCESS: Database setup complete!' as status,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created,
       (SELECT COUNT(*) FROM users) as users_created,
       (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as rls_policies_created,
       NOW() as completed_at;
