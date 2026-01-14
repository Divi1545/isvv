import { Request, Response, NextFunction } from 'express';

// Extend the Request interface to include session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export function authDebugMiddleware(req: Request, res: Response, next: NextFunction) {
  // Log authentication details for debugging deployment issues
  const authInfo = {
    sessionID: req.sessionID,
    hasSession: !!req.session,
    userId: (req.session as any)?.userId,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    host: req.get('Host'),
    protocol: req.protocol,
    secure: req.secure,
    cookies: Object.keys(req.cookies || {}),
    sessionCookie: req.cookies?.['connect.sid'] ? 'present' : 'missing'
  };

  // Only log for API requests to avoid spam
  if (req.path.startsWith('/api/')) {
    console.log(`[AUTH-DEBUG] ${req.method} ${req.path}:`, JSON.stringify(authInfo, null, 2));
  }

  next();
}