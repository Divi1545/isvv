# Enhanced IslandLoaf Server Architecture

## Overview
Advanced server implementation with comprehensive middleware, agent integration, webhook support, and production-ready logging system.

## Architecture Components

### 1. Enhanced Middleware Stack
- **Request Logging**: Comprehensive request/response tracking with unique IDs
- **CORS Configuration**: Multi-origin support for n8n, webhooks, and external services
- **Rate Limiting**: Authentication endpoint protection
- **Error Handling**: Structured error responses with fallback mechanisms
- **Session Management**: Secure session handling with rolling refresh

### 2. Agent Execution System
**Endpoint**: `POST /api/agent/execute`
**Authentication**: X-API-Key header required
**Purpose**: Universal agent command processor for external automation

**Supported Agents**:
- **Vendor Agent**: analyze, approve, suspend operations
- **Booking Agent**: create, confirm, cancel bookings  
- **Marketing Agent**: generate content, schedule campaigns
- **Support Agent**: create tickets, manage responses

**Request Format**:
```json
{
  "agent": "booking",
  "action": "create", 
  "data": {
    "vendorId": 1,
    "serviceId": 2,
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "startDate": "2024-07-01",
    "endDate": "2024-07-05",
    "totalPrice": 500
  },
  "requestId": "req-12345"
}
```

**Response Format**:
```json
{
  "success": true,
  "agent": "booking",
  "action": "create",
  "data": {
    "bookingId": 123,
    "status": "created",
    "totalPrice": 500,
    "commission": 50
  },
  "message": "booking agent executed create successfully",
  "metadata": {
    "requestId": "req-12345",
    "timestamp": "2024-01-15T10:30:00Z",
    "executionTime": 150
  }
}
```

### 3. Webhook Integration
**Supported Webhooks**:
- **n8n**: `/api/webhooks/n8n` - Workflow automation integration
- **Telegram**: `/api/webhooks/telegram` - Bot command processing
- **Stripe**: `/api/webhooks/stripe` - Payment event handling

**n8n Webhook Example**:
```json
{
  "workflow": "booking_automation",
  "data": {
    "vendorId": 1,
    "serviceId": 2,
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "startDate": "2024-08-01",
    "endDate": "2024-08-07",
    "totalPrice": 750
  },
  "executionId": "exec-12345"
}
```

### 4. System Monitoring
**Health Check**: `GET /api/health`
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "2.0.0",
  "environment": "development",
  "services": {
    "openai": true,
    "database": "memory",
    "storage": "operational",
    "agent_api": true
  },
  "endpoints": {
    "health": "/api/health",
    "agent": "/api/agent/execute", 
    "ai": "/api/ai/*",
    "webhooks": "/api/webhooks/*",
    "system": "/api/system/status"
  }
}
```

**System Status**: `GET /api/system/status`
```json
{
  "success": true,
  "data": {
    "service": "islandloaf-api",
    "version": "2.0.0",
    "environment": "development",
    "uptime": 3600,
    "memory": {
      "rss": 45678912,
      "heapTotal": 23456789,
      "heapUsed": 12345678
    },
    "services": {
      "database": "connected",
      "openai": true,
      "storage": "operational"
    }
  },
  "message": "System operational"
}
```

### 5. Enhanced Logging
**Features**:
- Unique request ID tracking
- Performance timing measurements
- Structured error logging with stack traces
- Console output in development
- File logging for production

**Log Format**:
```
[2024-01-15T10:30:00.123Z] POST /api/agent/execute - req-abc123
[2024-01-15T10:30:00.275Z] POST /api/agent/execute - 200 (152ms) - req-abc123
```

### 6. Security Features
**API Key Validation**:
- Required for agent endpoints
- Configurable via AGENT_API_KEY environment variable
- Returns structured error responses for invalid keys

**Rate Limiting**:
- Authentication endpoints limited to 5 requests per 15 minutes
- Prevents brute force attacks
- Customizable limits per endpoint

**CORS Protection**:
- Whitelist-based origin validation
- Support for regex patterns for subdomain matching
- Credential support for authenticated requests

## Environment Variables

### Required Configuration
```env
# Core Application
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-secure-session-secret

# AI Services  
OPENAI_API_KEY=sk-your-openai-key

# Agent Integration
AGENT_API_KEY=your-secure-agent-api-key

# External Services (Optional)
N8N_WEBHOOK_SECRET=your-n8n-webhook-secret
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Database (Optional)
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Development vs Production
**Development**:
- Console logging enabled
- CORS allows localhost origins
- Detailed error messages
- Session cookies not secure

**Production**:
- File-based logging only
- Strict CORS policy
- Generic error messages
- Secure session cookies with HTTPS

## Integration Examples

### n8n Workflow Integration
1. Configure webhook URL: `https://your-app.replit.app/api/webhooks/n8n`
2. Set webhook secret in environment variables
3. Send POST requests with workflow data
4. Receive structured responses with execution results

### Claude Agent Commands
1. Set AGENT_API_KEY in environment
2. Send POST to `/api/agent/execute` with X-API-Key header
3. Specify agent, action, and data parameters
4. Receive structured execution results

### External Service Monitoring
1. Use `/api/health` for basic service checks
2. Use `/api/system/status` for detailed system information
3. Monitor logs for request patterns and errors
4. Set up alerts based on response codes and timing

## Error Handling

### Structured Error Responses
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "NO_AUTH", 
  "requestId": "req-abc123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Codes
- `NO_AUTH`: Authentication required
- `INVALID_AUTH`: Invalid credentials
- `INVALID_API_KEY`: Invalid agent API key
- `INSUFFICIENT_PERMISSIONS`: Authorization failed
- `MISSING_PARAMS`: Required parameters missing
- `EXECUTION_FAILED`: Agent execution error
- `INTERNAL_ERROR`: Server error

### Fallback Mechanisms
All agent operations include fallback instructions for manual intervention when automated processing fails.

## Performance Considerations

### Request Timing
- All requests tracked with execution time
- Performance logs for optimization
- Timeout handling for external services

### Memory Management
- Memory usage monitoring via system status
- Garbage collection optimization
- Resource cleanup for long-running operations

### Scalability
- Stateless design for horizontal scaling
- Session storage can be moved to external store
- Database connection pooling ready
- Load balancer compatible

## Migration from Basic Server

### Compatibility
- All existing endpoints maintained
- Session-based authentication preserved
- Storage provider integration unchanged
- iCal extensions continue working

### New Features Added
- Agent execution endpoint
- Webhook processing
- Enhanced monitoring
- Structured logging
- Security hardening

### Upgrade Steps
1. Install additional dependencies (uuid, winston, jsonwebtoken, bcryptjs)
2. Set AGENT_API_KEY environment variable
3. Replace server/index.ts with enhanced-server.ts
4. Configure webhook endpoints as needed
5. Update monitoring to use new status endpoints

This enhanced architecture provides enterprise-grade capabilities while maintaining full backward compatibility with your existing IslandLoaf platform.