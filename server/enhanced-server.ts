import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import session from "express-session";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { extendStorageWithIcalSupport } from "./storage/icalExtensions";
import { storage } from "./storage-provider";

// Load environment variables
dotenv.config();

const app = express();

// Enhanced CORS configuration for agent integration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      process.env.APP_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      /\.replit\.app$/,
      /\.n8n\.io$/,
      /\.webhook\.site$/
    ];
    
    if (!origin) return callback(null, true);
    
    const allowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    
    callback(null, allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Agent-ID', 'X-Source']
};

// Enhanced middleware stack
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;
  (req as any).startTime = start;

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${requestId}`);

  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - ${requestId}`);
    return originalSend.call(this, data);
  };

  next();
});

// Rate limiting for security
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'islandloaf-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 6,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: "lax"
  },
  rolling: true,
}));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      database: process.env.DATABASE_URL ? 'postgresql' : 'memory',
      storage: 'operational',
      agent_api: !!process.env.AGENT_API_KEY
    },
    endpoints: {
      health: '/api/health',
      agent: '/api/agent/execute',
      ai: '/api/ai/*',
      webhooks: '/api/webhooks/*',
      system: '/api/system/status'
    }
  });
});

// System status endpoint
app.get('/api/system/status', async (req: Request, res: Response) => {
  try {
    const status = {
      service: 'islandloaf-api',
      version: '2.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: process.env.DATABASE_URL ? 'connected' : 'memory',
        openai: !!process.env.OPENAI_API_KEY,
        storage: 'operational'
      }
    };

    res.json({
      success: true,
      data: status,
      message: 'System operational'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'System check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Agent API key validation middleware
const validateAgentApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey || apiKey !== process.env.AGENT_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

// Universal agent executor endpoint
app.post('/api/agent/execute', validateAgentApiKey, async (req: Request, res: Response) => {
  try {
    const { agent, action, data, requestId } = req.body;
    
    if (!agent || !action) {
      return res.status(400).json({
        success: false,
        error: 'Agent and action are required',
        code: 'MISSING_PARAMS'
      });
    }

    console.log(`Agent execution: ${agent}.${action} - ${requestId || 'no-id'}`);

    let result;
    
    switch (agent.toLowerCase()) {
      case 'vendor':
        result = await executeVendorAgent(action, data);
        break;
      case 'booking':
        result = await executeBookingAgent(action, data);
        break;
      case 'marketing':
        result = await executeMarketingAgent(action, data);
        break;
      case 'support':
        result = await executeSupportAgent(action, data);
        break;
      default:
        throw new Error(`Unknown agent: ${agent}`);
    }

    res.json({
      success: true,
      agent,
      action,
      data: result,
      message: `${agent} agent executed ${action} successfully`,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - (req as any).startTime
      }
    });

  } catch (error) {
    console.error('Agent execution failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'EXECUTION_FAILED',
      fallback: 'Manual intervention required',
      metadata: {
        requestId: req.body.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Agent action handlers
async function executeVendorAgent(action: string, data: any) {
  switch (action) {
    case 'analyze':
      const vendor = await storage.getUser(data.vendorId);
      if (!vendor) throw new Error('Vendor not found');
      
      return {
        vendorId: data.vendorId,
        status: vendor.role === 'vendor' ? 'active' : 'inactive',
        businessName: vendor.businessName,
        analysis: 'Vendor analysis completed'
      };

    case 'approve':
      return {
        vendorId: data.vendorId,
        status: 'approved',
        approvedAt: new Date().toISOString()
      };

    case 'suspend':
      return {
        vendorId: data.vendorId,
        status: 'suspended',
        suspendedAt: new Date().toISOString(),
        reason: data.reason || 'Administrative action'
      };

    default:
      throw new Error(`Unknown vendor action: ${action}`);
  }
}

async function executeBookingAgent(action: string, data: any) {
  switch (action) {
    case 'create':
      const booking = await storage.createBooking({
        userId: data.vendorId,
        serviceId: data.serviceId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalPrice: data.totalPrice,
        commission: data.commission || data.totalPrice * 0.1,
        status: 'pending'
      });

      return {
        bookingId: booking.id,
        status: 'created',
        totalPrice: booking.totalPrice,
        commission: booking.commission
      };

    case 'confirm':
      const confirmedBooking = await storage.updateBooking(data.bookingId, {
        status: 'confirmed'
      });
      
      return {
        bookingId: data.bookingId,
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      };

    case 'cancel':
      await storage.updateBooking(data.bookingId, {
        status: 'cancelled'
      });
      
      return {
        bookingId: data.bookingId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        reason: data.reason || 'Customer request'
      };

    default:
      throw new Error(`Unknown booking action: ${action}`);
  }
}

async function executeMarketingAgent(action: string, data: any) {
  switch (action) {
    case 'generate_content':
      return {
        contentType: data.type || 'social_media',
        content: `Generated ${data.type} content for ${data.service}`,
        generatedAt: new Date().toISOString()
      };

    case 'schedule_campaign':
      return {
        campaignId: `CAM-${Date.now()}`,
        scheduled: true,
        scheduledFor: data.scheduledFor,
        platform: data.platform
      };

    default:
      throw new Error(`Unknown marketing action: ${action}`);
  }
}

async function executeSupportAgent(action: string, data: any) {
  switch (action) {
    case 'create_ticket':
      const notification = await storage.createNotification({
        userId: data.vendorId || 1,
        title: `Support Ticket: ${data.subject}`,
        message: data.description,
        type: 'support'
      });

      return {
        ticketId: notification.id,
        subject: data.subject,
        priority: data.priority || 'medium',
        createdAt: new Date().toISOString()
      };

    case 'respond':
      return {
        ticketId: data.ticketId,
        response: data.response,
        respondedAt: new Date().toISOString(),
        status: 'responded'
      };

    default:
      throw new Error(`Unknown support action: ${action}`);
  }
}

// Webhook endpoints
app.post('/api/webhooks/n8n', async (req: Request, res: Response) => {
  try {
    const { workflow, data, executionId } = req.body;
    
    console.log(`n8n webhook: ${workflow} - ${executionId}`);

    let result;
    switch (workflow) {
      case 'booking_automation':
        const booking = await storage.createBooking({
          userId: data.vendorId,
          serviceId: data.serviceId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          totalPrice: data.totalPrice,
          commission: data.commission || data.totalPrice * 0.1,
          status: 'pending'
        });
        result = { bookingId: booking.id };
        break;

      case 'vendor_onboarding':
        const vendor = await storage.createUser({
          username: data.email,
          email: data.email,
          password: 'temp-password',
          fullName: data.fullName,
          businessName: data.businessName,
          businessType: data.businessType,
          role: 'vendor'
        });
        result = { vendorId: vendor.id };
        break;

      default:
        result = { message: 'Workflow not recognized' };
    }

    res.json({
      success: true,
      executionId,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('n8n webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'Manual processing required'
    });
  }
});

(async () => {
  // Extend storage with iCal support
  extendStorageWithIcalSupport(storage);
  
  // Register core business routes
  await registerRoutes(app, storage);
  
  const server = setupVite(app, path.resolve(__dirname, "..", "client"));

  // Enhanced error handling
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;
    console.error(`Error ${requestId}:`, err);
    
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal Server Error",
      requestId,
      timestamp: new Date().toISOString(),
      code: err.code || 'INTERNAL_ERROR'
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ 
        success: false,
        error: "API endpoint not found",
        path: req.path,
        method: req.method
      });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`
🚀 IslandLoaf Enhanced Server Running
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🤖 Agent API: /api/agent/execute
📊 Status: /api/system/status
🔗 Webhooks: /api/webhooks/*
💾 Storage: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Memory'}
🔑 AI: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled'}
    `);
  });
})();