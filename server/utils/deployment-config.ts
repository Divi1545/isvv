/**
 * Deployment configuration utilities
 * Handles environment-specific settings for authentication and CORS
 */

export function getDeploymentConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const replitDomains = process.env.REPLIT_DOMAINS?.split(',').map(d => d.trim()) || [];
  const isCustomDomain = replitDomains.some(domain => 
    domain.includes('islandloafvendor.com') || 
    domain.includes('islandloaf')
  );

  console.log('[DEPLOYMENT-CONFIG]', {
    NODE_ENV: process.env.NODE_ENV,
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
    isProduction,
    isCustomDomain,
    replitDomains
  });

  return {
    isProduction,
    isCustomDomain,
    replitDomains,
    sessionConfig: {
      secure: isProduction || isCustomDomain,
      sameSite: isCustomDomain ? "none" as const : "lax" as const,
      domain: undefined // Always let browser handle domain
    },
    corsOrigins: [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://islandloafvendor.com',
      'https://www.islandloafvendor.com',
      ...replitDomains.map(domain => `https://${domain}`),
      ...replitDomains.map(domain => `http://${domain}`)
    ]
  };
}