/**
 * IslandLoaf "Always On" Script
 * This script pings your Replit server to keep it awake
 * 
 * To use this script:
 * 1. Set up a free uptime monitoring service like UptimeRobot (https://uptimerobot.com/) 
 * 2. Create a monitor that pings your Replit app URL every 5 minutes
 * 3. For extra reliability, you can also use a secondary service like Cron-Job.org
 */

const http = require('http');
const https = require('https');

// Your Replit app URL
const APP_URL = process.env.APP_URL || 'https://your-replit-app.replit.app';

// Function to ping the server
function pingServer() {
  console.log(`Pinging ${APP_URL} to keep it awake...`);
  
  const client = APP_URL.startsWith('https') ? https : http;
  
  const req = client.get(APP_URL, (res) => {
    const { statusCode } = res;
    console.log(`Server response: ${statusCode}`);
    
    if (statusCode !== 200) {
      console.error(`Server returned non-200 status code: ${statusCode}`);
    }
  });
  
  req.on('error', (error) => {
    console.error(`Error pinging server: ${error.message}`);
  });
  
  req.end();
}

// Ping immediately on start
pingServer();

// Ping every 5 minutes (300000 ms)
// This is a fallback in case external ping services fail
setInterval(pingServer, 300000);

console.log('🚀 Always-On script is running...');
console.log('✅ Server will be kept awake with regular pings');
console.log('⚠️ For production, consider upgrading to Replit Boosted or a dedicated hosting service');

// This script can be run with:
// node scripts/always-on.js