# IslandLoaf AI Agents - Curl Examples

Quick reference for testing agent tool endpoints.

## Setup

```bash
# Set your agent key
export AGENT_KEY="agent_abc123..."
export BASE_URL="http://localhost:8080"

# For production
# export BASE_URL="https://yourdomain.com"
```

## Vendor Management

### Create Vendor
```bash
curl -X POST $BASE_URL/api/agent/tools/vendors/create \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johndoe@beachvillas.com",
    "fullName": "John Doe",
    "businessName": "Doe Beach Villas",
    "businessType": "stays",
    "password": "SecurePass123!",
    "categoriesAllowed": ["stays", "tours"]
  }'
```

### Approve Vendor (LEADER/OWNER)
```bash
curl -X POST $BASE_URL/api/agent/tools/vendors/approve \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": 5
  }'
```

### Suspend Vendor (LEADER/OWNER, high-risk)
```bash
curl -X POST $BASE_URL/api/agent/tools/vendors/suspend \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": 5,
    "reason": "Policy violation: fake reviews"
  }'
```

## Service Management

### Create Service
```bash
curl -X POST $BASE_URL/api/agent/tools/services/create \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5,
    "name": "Beachfront Villa - 3BR with Pool",
    "description": "Stunning beachfront property with private pool, sleeps 6",
    "type": "stays",
    "basePrice": 250.00,
    "available": true
  }'
```

### Update Service Price
```bash
curl -X POST $BASE_URL/api/agent/tools/services/update \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 42,
    "basePrice": 275.00,
    "available": true
  }'
```

## Booking Management

### Create Booking (with idempotency)
```bash
curl -X POST $BASE_URL/api/agent/tools/bookings/create \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: booking-$(date +%s)-001" \
  -d '{
    "userId": 5,
    "serviceId": 42,
    "customerName": "Jane Smith",
    "customerEmail": "jane.smith@example.com",
    "startDate": "2026-03-15",
    "endDate": "2026-03-20",
    "totalPrice": 1375.00,
    "commission": 137.50,
    "notes": "Vegetarian meals requested"
  }'
```

### Update Booking Status
```bash
curl -X POST $BASE_URL/api/agent/tools/bookings/update-status \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 789,
    "status": "confirmed",
    "reason": "Payment verified"
  }'
```

## Calendar Sync

### Add Calendar Source
```bash
curl -X POST $BASE_URL/api/agent/tools/calendar/add-source \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5,
    "serviceId": 42,
    "name": "Airbnb Calendar",
    "url": "https://www.airbnb.com/calendar/ical/12345678",
    "type": "airbnb"
  }'
```

### Trigger Calendar Sync
```bash
curl -X POST $BASE_URL/api/agent/tools/calendar/sync \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "calendarSourceId": 10
  }'
```

## Pricing

### Update Base Price
```bash
curl -X POST $BASE_URL/api/agent/tools/pricing/update-base \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 42,
    "basePrice": 300.00
  }'
```

## Support

### Create Support Ticket
```bash
curl -X POST $BASE_URL/api/agent/tools/support/tickets/create \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "subject": "Payment Gateway Error",
    "message": "Customer reports Stripe checkout failed with error: card_declined. Booking ID: 789",
    "priority": "high"
  }'
```

## Marketing

### Create Campaign
```bash
curl -X POST $BASE_URL/api/agent/tools/marketing/campaigns/create \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Flash Sale - 30% Off",
    "type": "email",
    "message": "Book your Sri Lankan adventure now! Limited time offer: 30% off all beachfront properties. Use code SUMMER30 at checkout.",
    "targetAudience": "customers",
    "startDate": "2026-06-01",
    "endDate": "2026-06-15"
  }'
```

### Launch Campaign
```bash
curl -X POST $BASE_URL/api/agent/tools/marketing/campaigns/launch \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "CAM-1736105423000"
  }'
```

## Finance

### Create Checkout Session
```bash
curl -X POST $BASE_URL/api/agent/tools/finance/checkout/create \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 789,
    "amount": 1375.00,
    "currency": "USD",
    "customerEmail": "jane.smith@example.com",
    "successUrl": "https://islandloaf.com/booking/success?booking_id=789",
    "cancelUrl": "https://islandloaf.com/booking/cancel?booking_id=789"
  }'
```

### Process Refund (FINANCE/OWNER, high-risk)
```bash
curl -X POST $BASE_URL/api/agent/tools/finance/refund \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: refund-$(date +%s)-001" \
  -d '{
    "bookingId": 789,
    "amount": 1375.00,
    "reason": "Customer requested full refund due to medical emergency",
    "paymentIntentId": "pi_1234567890abcdef"
  }'
```

## Task Management

### Query Tasks
```bash
curl -X GET "$BASE_URL/api/agent/tasks?status=QUEUED&role=BOOKING_MANAGER&limit=10" \
  -H "x-agent-key: $AGENT_KEY"
```

### Manual Task Runner Tick
```bash
curl -X POST $BASE_URL/api/agent/cron/tick \
  -H "x-agent-key: $AGENT_KEY"
```

## Audit Logs

### Query Audit Logs
```bash
curl -X GET "$BASE_URL/api/agent/audit-logs?status=SUCCESS&limit=20" \
  -H "x-agent-key: $AGENT_KEY"
```

### Query Audit Logs for Specific Agent
```bash
export AGENT_ID="123e4567-e89b-12d3-a456-426614174000"

curl -X GET "$BASE_URL/api/agent/audit-logs?agentId=$AGENT_ID&limit=50" \
  -H "x-agent-key: $AGENT_KEY"
```

## Telegram Webhook

### Send Test Webhook (simulate Telegram)
```bash
curl -X POST $BASE_URL/api/telegram/webhook \
  -H "x-telegram-bot-api-secret-token: YOUR_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "message_id": 123,
      "from": {
        "id": 987654321,
        "first_name": "John",
        "username": "johndoe"
      },
      "chat": {
        "id": 987654321,
        "type": "private"
      },
      "date": 1736105423,
      "text": "Create booking for Jane Smith from 2026-03-15 to 2026-03-20"
    }
  }'
```

## Admin Endpoints (Session-Based)

### Create Agent Identity (requires admin session)
```bash
# First login as admin
curl -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@islandloaf.com",
    "password": "your-admin-password"
  }'

# Create agent
curl -X POST $BASE_URL/api/agent/identities \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Finance Bot",
    "role": "FINANCE",
    "metadata": {
      "purpose": "Automated payment processing"
    }
  }'
```

### List Agents
```bash
curl -X GET $BASE_URL/api/agent/identities \
  -b cookies.txt
```

### Update Agent
```bash
curl -X PATCH $BASE_URL/api/agent/identities/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "isActive": false
  }'
```

## Testing Idempotency

### Same Request Twice (should return cached result)
```bash
# First request
curl -X POST $BASE_URL/api/agent/tools/bookings/create \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-idempotency-123" \
  -d '{
    "userId": 5,
    "serviceId": 42,
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "startDate": "2026-04-01",
    "endDate": "2026-04-05",
    "totalPrice": 1000.00,
    "commission": 100.00
  }'

# Second request (same key) - should return cached result with "cached": true
curl -X POST $BASE_URL/api/agent/tools/bookings/create \
  -H "x-agent-key: $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-idempotency-123" \
  -d '{
    "userId": 5,
    "serviceId": 42,
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "startDate": "2026-04-01",
    "endDate": "2026-04-05",
    "totalPrice": 1000.00,
    "commission": 100.00
  }'
```

## Health Checks

### API Health
```bash
curl $BASE_URL/api/health
```

### Railway Health (fast, no auth)
```bash
curl $BASE_URL/health
```

## Tips

### Pretty Print JSON
```bash
curl ... | jq '.'
```

### Save Response to File
```bash
curl ... -o response.json
```

### Verbose Output (debug)
```bash
curl -v ...
```

### Follow Redirects
```bash
curl -L ...
```



