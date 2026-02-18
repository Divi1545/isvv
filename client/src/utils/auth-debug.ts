// Client-side authentication debugging utilities

export function logAuthDebug(message: string, context?: any) {
  const debugInfo = {
    context: message,
    timestamp: new Date().toISOString(),
    location: window.location.href,
    origin: window.location.origin,
    domain: window.location.hostname,
    protocol: window.location.protocol,
    cookies: document.cookie,
    localStorage: {
      authToken: localStorage.getItem('authToken') ? 'present' : 'missing'
    },
    userAgent: navigator.userAgent
  };

  if (context) {
    Object.assign(debugInfo, { extraContext: context });
  }

  console.log(`[CLIENT-AUTH-DEBUG] ${message}:`, debugInfo);
}

export function debugLoginAttempt(email: string, success: boolean, error?: string) {
  logAuthDebug(`Login attempt ${success ? 'successful' : 'failed'}`, {
    email,
    success,
    error: error || null
  });
}

export function debugCookieIssues() {
  const cookieInfo = {
    hasCookies: document.cookie.length > 0,
    cookies: document.cookie,
    sameSiteSupport: 'SameSite' in document.createElement('a'),
    secureContext: window.isSecureContext,
    location: window.location.href
  };
  
  console.log('[COOKIE-DEBUG] Cookie information:', cookieInfo);
  return cookieInfo;
}