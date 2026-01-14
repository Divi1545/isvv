# IslandLoaf AI Agent Organization

## Overview

The IslandLoaf AI Agent Organization is a production-safe, auditable, and idempotent system that allows AI agents to operate the tourism marketplace platform through secure API endpoints. The system supports multiple communication channels (Telegram, webhooks, direct API calls) and uses a Leader agent to decompose tasks and delegate to specialized agents.

## Architecture

```
External Channels → Leader Agent → Task Queue → Specialized Agents → Storage Layer
     ↓                                                                        ↓
  Telegram                                                             PostgreSQL
  Webhooks                                                          (or in-memory)
  Direct API
```

### Components

1. **Leader Agent**: Decomposes incoming requests into tasks and routes to specialized agents
2. **Task Queue**: PostgreSQL-backed queue for async task processing
3. **Specialized Agents**: 7 domain-specific executors (vendor, booking, calendar, pricing, marketing, support, finance)
4. **Security Layer**: RBAC + audit logging + idempotency
5. **Communication Channels**: Telegram bot + webhook endpoints + direct tool APIs

## Agent Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **OWNER** | All permissions | Superuser, bypasses approval gates |
| **LEADER** | Task creation, vendor management, data access | Orchestration, task routing |
| **VENDOR_ONBOARDING** | Create/update vendors, send notifications | Vendor signup automation |
| **BOOKING_MANAGER** | Create/update bookings, check availability | Booking automation |
| **CALENDAR_SYNC** | Add calendar sources, sync calendars | External calendar integration |
| **PRICING** | Update service prices, manage pricing rules | Dynamic pricing automation |
| **MARKETING** | Create campaigns, generate content, launch | Marketing automation |
| **SUPPORT** | Create tickets, update status | Customer support automation |
| **FINANCE** | Create checkout sessions, process refunds | Payment automation |

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string (for production)
- `PORT`: Server port (Railway requires this)

### Agent System
- `AGENT_RUNNER_ENABLED`: `true` to enable background task runner (default: `false`)
- `OWNER_AGENT_KEY`: Optional superuser key for bypassing approval gates
- `REQUIRE_OWNER_APPROVAL`: `true` to require OWNER approval for high-risk actions (refunds, vendor suspension)

### External Services (Optional)
- `OPENAI_API_KEY`: Enhances Leader planning + marketing content generation
- `TELEGRAM_BOT_TOKEN`: Telegram bot integration
- `TELEGRAM_WEBHOOK_SECRET`: Webhook verification token
- `STRIPE_SECRET_KEY`: Payment processing
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook verification

## Setup Guide

### 1. Database Setup

```bash
# Ensure DATABASE_URL is set in .env
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/islandloaf" >> .env

# Generate and apply migrations
npm run db:generate
npm run db:push
```

### 2. Create First Agent Key

```bash
# Interactive CLI
npm run agent:create-key

# Follow prompts:
# - Agent name: My Leader Agent
# - Role: LEADER
# - Confirm: y

# Save the generated API key securely!
```

### 3. Test Manual Task Runner

```bash
curl -X POST http://localhost:8080/api/agent/cron/tick \
  -H "x-agent-key: YOUR_LEADER_KEY"

# Expected response:
# {
#   "success": true,
#   "tasksProcessed": 0,
#   "tasksSucceeded": 0,
#   "tasksFailed": 0,
#   "details": [],
#   "timestamp": "2026-01-05T..."
# }
```

### 4. Optional: Enable Background Runner

```bash
echo "AGENT_RUNNER_ENABLED=true" >> .env

# Restart server - runner will process tasks every 30 seconds
npm run start
```

### 5. Optional: Telegram Integration

```bash
# Create bot with @BotFather, get token
echo "TELEGRAM_BOT_TOKEN=123456789:ABC..." >> .env
echo "TELEGRAM_WEBHOOK_SECRET=your-secret-token" >> .env

# Set webhook URL (do this once)
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/api/telegram/webhook",
    "secret_token": "your-secret-token"
  }'
```

## API Reference

### Agent Management (Admin Only)

#### Create Agent Identity
```bash
POST /api/agent/identities
Content-Type: application/json
Cookie: connect.sid=<admin_session>

{
  "name": "My Agent",
  "role": "VENDOR_ONBOARDING",
  "metadata": {}
}

# Response includes plaintext API key (shown only once!)
```

#### List Agents
```bash
GET /api/agent/identities
Cookie: connect.sid=<admin_session>
```

#### Update Agent
```bash
PATCH /api/agent/identities/:id
Content-Type: application/json
Cookie: connect.sid=<admin_session>

{
  "isActive": false
}
```

### Tool Endpoints

All tool endpoints require:
- `x-agent-key` header
- Appropriate role permissions
- Optional `Idempotency-Key` header (recommended for non-idempotent operations)

#### Vendor Management

**Create Vendor**
```bash
POST /api/agent/tools/vendors/create
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "email": "vendor@example.com",
  "fullName": "John Doe",
  "businessName": "Doe Stays",
  "businessType": "stays",
  "password": "secure_password_123"
}
```

**Approve Vendor** (LEADER/OWNER only)
```bash
POST /api/agent/tools/vendors/approve
x-agent-key: YOUR_LEADER_KEY
Content-Type: application/json

{
  "vendorId": 123
}
```

**Suspend Vendor** (LEADER/OWNER only, high-risk)
```bash
POST /api/agent/tools/vendors/suspend
x-agent-key: YOUR_LEADER_KEY
Content-Type: application/json

{
  "vendorId": 123,
  "reason": "Policy violation"
}
```

#### Service Management

**Create Service**
```bash
POST /api/agent/tools/services/create
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "userId": 5,
  "name": "Beachfront Villa",
  "description": "Luxury 3BR villa with pool",
  "type": "stays",
  "basePrice": 150.00,
  "available": true
}
```

**Update Service**
```bash
POST /api/agent/tools/services/update
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "serviceId": 42,
  "basePrice": 175.00
}
```

#### Booking Management

**Create Booking** (with availability check)
```bash
POST /api/agent/tools/bookings/create
x-agent-key: YOUR_KEY
Content-Type: application/json
Idempotency-Key: booking-abc-123

{
  "userId": 5,
  "serviceId": 42,
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "startDate": "2026-02-01",
  "endDate": "2026-02-05",
  "totalPrice": 700.00,
  "commission": 70.00,
  "notes": "Early check-in requested"
}
```

**Update Booking Status**
```bash
POST /api/agent/tools/bookings/update-status
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "bookingId": 789,
  "status": "confirmed",
  "reason": "Payment received"
}
```

#### Calendar Sync

**Add Calendar Source**
```bash
POST /api/agent/tools/calendar/add-source
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "userId": 5,
  "serviceId": 42,
  "name": "Airbnb Calendar",
  "url": "https://www.airbnb.com/calendar/ical/...",
  "type": "airbnb"
}
```

**Trigger Sync**
```bash
POST /api/agent/tools/calendar/sync
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "calendarSourceId": 10
}
```

#### Pricing

**Update Base Price**
```bash
POST /api/agent/tools/pricing/update-base
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "serviceId": 42,
  "basePrice": 200.00
}
```

#### Support

**Create Ticket**
```bash
POST /api/agent/tools/support/tickets/create
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "userId": 1,
  "subject": "Payment issue",
  "message": "Customer cannot complete checkout",
  "priority": "high"
}
```

#### Marketing

**Create Campaign** (in-memory, non-critical)
```bash
POST /api/agent/tools/marketing/campaigns/create
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "title": "Summer Sale",
  "type": "email",
  "message": "Book now and save 20%!",
  "targetAudience": "customers"
}
```

**Launch Campaign**
```bash
POST /api/agent/tools/marketing/campaigns/launch
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "campaignId": "CAM-1736105423000"
}
```

#### Finance

**Create Checkout Session**
```bash
POST /api/agent/tools/finance/checkout/create
x-agent-key: YOUR_KEY
Content-Type: application/json

{
  "bookingId": 789,
  "amount": 700.00,
  "currency": "USD",
  "customerEmail": "jane@example.com",
  "successUrl": "https://islandloaf.com/booking/success",
  "cancelUrl": "https://islandloaf.com/booking/cancel"
}

# Response includes Stripe checkout URL (or mock if Stripe not configured)
```

**Process Refund** (FINANCE/OWNER only, high-risk)
```bash
POST /api/agent/tools/finance/refund
x-agent-key: YOUR_FINANCE_KEY
Content-Type: application/json
Idempotency-Key: refund-xyz-456

{
  "bookingId": 789,
  "amount": 700.00,
  "reason": "Customer request",
  "paymentIntentId": "pi_..."
}

# Note: Stub implementation - requires Stripe refund logic in production
```

### Task Management

**Query Tasks** (LEADER/OWNER only)
```bash
GET /api/agent/tasks?status=QUEUED&role=VENDOR_ONBOARDING
x-agent-key: YOUR_LEADER_KEY
```

**Manual Task Runner Tick** (LEADER/OWNER only)
```bash
POST /api/agent/cron/tick
x-agent-key: YOUR_LEADER_KEY

# Processes at most 1 task per role
```

### Audit Logs

**Query Audit Logs** (LEADER/OWNER only)
```bash
GET /api/agent/audit-logs?status=SUCCESS&limit=50
x-agent-key: YOUR_LEADER_KEY
```

## Telegram Bot Usage

### Commands

- `/start` - Start the bot
- `/help` - Show help message
- `/status` - Check system status

### Natural Language Requests

Send natural language messages to the bot:

```
"Add vendor: email=john@beach.com, name=Beach Villas, type=stays"

"Create booking for Jane Smith from 2026-02-01 to 2026-02-05"

"Help with payment issue for booking 789"
```

The Leader agent will parse the message, create tasks, and respond with task IDs.

## Security Best Practices

### API Key Management
- Store keys securely (use environment variables or secret managers)
- Rotate keys regularly (deactivate old keys via admin panel)
- Never commit keys to version control
- Use different keys for different environments (dev, staging, prod)

### OWNER Key
- Use sparingly (only for emergency actions)
- Store separately from other keys
- Consider using `REQUIRE_OWNER_APPROVAL=true` for high-risk actions

### Idempotency
- Always use `Idempotency-Key` header for create/update operations
- Keys expire after 24 hours
- Same key with same agent = cached result (no duplicate action)

### Audit Logging
- All agent actions are logged to `agent_audit_logs` table
- Query logs regularly to monitor agent activity
- Set up alerting for failed tasks or suspicious patterns

## Task Execution Models

### Manual (Default)
- Tasks queued in database
- Execute via: `POST /api/agent/cron/tick`
- Recommended for Railway/cron jobs
- Example cron: `*/5 * * * * curl -X POST https://your-domain.com/api/agent/cron/tick -H "x-agent-key: YOUR_KEY"`

### Background (Optional)
- Set `AGENT_RUNNER_ENABLED=true`
- Runs every 30 seconds automatically
- Safe for long-running processes (concurrency lock prevents overlap)
- Processes at most 1 task per role per tick

## Troubleshooting

### Tasks Not Processing
1. Check task status: `GET /api/agent/tasks`
2. Verify DATABASE_URL is set
3. Check agent role has correct permissions
4. Look for errors in audit logs

### Telegram Bot Not Responding
1. Verify `TELEGRAM_BOT_TOKEN` is set
2. Check webhook is configured: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
3. Verify `TELEGRAM_WEBHOOK_SECRET` matches
4. Check server logs for webhook errors

### Idempotency Not Working
1. Ensure same agent + same key is used
2. Check key hasn't expired (24h TTL)
3. Verify database connection is active

### High-Risk Actions Blocked
- If `REQUIRE_OWNER_APPROVAL=true`, only OWNER can execute:
  - Refunds
  - Vendor suspension
  - Post-payment cancellations
- Use OWNER key or disable approval gate

## Migration Notes

### Marketing Campaigns
⚠️ **Non-Critical**: Campaigns are currently in-memory only (not persisted in PostgreSQL). They will be lost on server restart. This is intentional for MVP. Add a `campaigns` table in production if persistence is required.

### Stripe Integration
⚠️ **Functional Stubs**: 
- Checkout session creation works if `STRIPE_SECRET_KEY` is set
- Refund endpoint is a stub (logs refund but doesn't call Stripe API)
- Implement `stripe.refunds.create()` + webhook confirmation for production

### Production Readiness Checklist
- [x] All endpoints validate input with Zod
- [x] All agent actions write to audit log
- [x] Idempotency prevents duplicate operations
- [x] Policy engine enforces RBAC
- [x] Agent keys are hashed (never stored plaintext)
- [x] Errors are caught and logged
- [x] `/health` endpoint remains fast
- [x] Background runner has concurrency lock
- [x] Stripe gracefully handles missing credentials
- [x] Telegram gracefully handles missing bot token
- [x] OpenAI gracefully handles missing API key
- [x] Documentation is complete

## Support

For issues or questions:
1. Check logs: `server/` console output
2. Query audit logs: `GET /api/agent/audit-logs`
3. Query task status: `GET /api/agent/tasks`
4. Create support ticket via agent: `POST /api/agent/tools/support/tickets/create`



