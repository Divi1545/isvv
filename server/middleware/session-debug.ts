import { Request, Response, NextFunction } from 'express';

export function sessionDebugMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionInfo = {
    sessionID: req.sessionID,
    hasSession: !!req.session,
    sessionUser: req.session?.user,
    cookies: req.headers.cookie,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    host: req.get('Host'),
    method: req.method,
    path: req.path
  };

  // Only log for API requests to reduce noise
  if (req.path.startsWith('/api/')) {
    console.log(`[SESSION-DEBUG] ${req.method} ${req.path}:`, JSON.stringify(sessionInfo, null, 2));
  }

  next();
}