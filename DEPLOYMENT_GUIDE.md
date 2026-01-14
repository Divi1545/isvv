# IslandLoaf - Deployment Guide for Replit

## ✅ Fixes Implemented

All login persistence and Supabase connection issues have been fixed:

### 1. **Removed Aggressive Auto-Logout** ✅
- Removed `beforeunload` event that logged users out on page refresh
- Removed `visibilitychange` event that logged users out after 30 seconds of tab switching
- **Result:** Users now stay logged in across page refreshes and tab switches

### 2. **Improved Session Configuration** ✅
- Set `secure: false` for Replit compatibility (behind reverse proxy)
- Increased session duration from 24 hours to 7 days
- Added `rolling: true` to refresh sessions on user activity
- **Result:** Sessions persist longer and refresh automatically

### 3. **Enhanced Database Connection Handling** ✅
- Better error logging for PostgreSQL connection failures
- Graceful fallback to memory store if Supabase connection fails
- Special handling for Supabase pooler connections
- **Result:** App works even during temporary database issues

### 4. **Added Database Health Check** ✅
- Tests database connection on server startup
- Provides clear error messages if connection fails
- Shows PostgreSQL version and connection status
- **Result:** Immediate feedback on configuration problems

### 5. **Improved Session Restoration** ✅
- Added retry logic (3 attempts with exponential backoff)
- Only logs out on explicit 401 (not authenticated) responses
- Network hiccups no longer cause automatic logout
- **Result:** More robust login persistence

### 6. **Created Environment Configuration Template** ✅
- Created `env.example` with all required variables
- Clear documentation for each variable
- Replit-specific deployment notes
- **Result:** Easy setup reference for production deployment

---

## 🚀 Deploy to Replit

Follow these steps to deploy the fixed app to Replit:

### Step 1: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and open your project
2. Navigate to **Settings** → **Database**
3. Copy the following connection strings:

   **Connection Pooler (Port 6543)** - Recommended for production:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

   **Direct Connection (Port 5432)** - Fallback:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

### Step 2: Configure Replit Secrets

1. In your Replit project, click the **Secrets** tab (lock icon) in the left sidebar
2. Add each of these environment variables:

| Secret Name | Value | Notes |
|------------|-------|-------|
| `SUPABASE_DB_URL` | Connection pooler URL (port 6543) | ✅ Required |
| `DATABASE_URL` | Direct connection URL (port 5432) | ✅ Required |
| `SESSION_SECRET` | Generate a random 32+ character string | ✅ Required |
| `NODE_ENV` | `production` | ✅ Required |
| `ADMIN_PASSWORD` | Choose a secure password | ✅ Required |
| `PORT` | `5000` | Optional (has default) |
| `OPENAI_API_KEY` | Your OpenAI API key | Optional (for AI features) |

**Generate Session Secret:**
```bash
# Option 1: Use OpenSSL (if available)
openssl rand -base64 32

# Option 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Use any random string generator (min 32 characters)
```

### Step 3: Push Code to Replit

1. **If using Git:**
   ```bash
   git add .
   git commit -m "Fix Supabase connection and login persistence"
   git push
   ```

2. **If uploading directly:**
   - Zip your project files
   - Upload to Replit
   - Extract in the Replit workspace

### Step 4: Install Dependencies & Start

In the Replit Shell, run:

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Or simply click the **Run** button in Replit.

### Step 5: Verify Deployment

Watch the server logs for these success messages:

```
✅ Expected Log Messages:
[DB-HEALTH] Testing database connection...
[DB-HEALTH] ✅ Database connection successful!
🔐 Session store: PostgreSQL
📊 Database: Connected to Supabase PostgreSQL
🚀 IslandLoaf API ready at http://0.0.0.0:5000
```

**If you see warnings:**
```
⚠️  [SESSION] No DATABASE_URL or SUPABASE_DB_URL found
⚠️  Database: Using memory store (sessions will not persist)
```
→ Check your Replit Secrets configuration

---

## 🧪 Testing Checklist

After deployment, test these scenarios:

### Login Persistence Tests

- [ ] **Test 1:** Login with credentials
  - Expected: Successful login, redirected to dashboard

- [ ] **Test 2:** Refresh the page (F5 or Cmd+R)
  - Expected: Still logged in, no redirect to login page

- [ ] **Test 3:** Switch to another tab for 1 minute
  - Expected: Return to app tab, still logged in

- [ ] **Test 4:** Close browser and reopen app URL
  - Expected: Still logged in (within 7 days)

- [ ] **Test 5:** Check browser DevTools → Application → Cookies
  - Expected: See `connect.sid` cookie with 7-day expiration

### Database Connection Tests

- [ ] **Test 6:** Check Replit logs for database health check
  - Expected: See "✅ Database connection successful!"

- [ ] **Test 7:** Create a new booking or service
  - Expected: Data persists after page refresh

- [ ] **Test 8:** Restart the Replit server
  - Expected: Still logged in after restart (session in database)

---

## 🔧 Troubleshooting

### Issue: "Database connection failed"

**Solution:**
1. Verify `SUPABASE_DB_URL` is correctly formatted
2. Check password has no special characters that need URL encoding
3. Ensure Supabase project is active (not paused)
4. Try the direct connection URL instead of pooler

### Issue: "Sessions not persisting"

**Solution:**
1. Check Replit logs for session store messages
2. Verify `SESSION_SECRET` is set in Secrets
3. Confirm database connection is successful
4. Check browser isn't blocking cookies

### Issue: "Still getting logged out on refresh"

**Solution:**
1. Clear browser cache and cookies
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Try in incognito/private browsing mode
4. Check browser console for errors

### Issue: "401 Unauthorized on /api/me"

**Solution:**
1. Check session cookie exists in browser
2. Verify session table exists in Supabase
3. Restart Replit server
4. Re-login to create fresh session

---

## 📊 Monitoring

### Check Session Table in Supabase

1. Go to Supabase dashboard → **Table Editor**
2. Look for `session` table (auto-created by app)
3. You should see active sessions with `expire` dates

### View Server Logs

In Replit, check the Console tab for:
- Database connection status
- Session store type (PostgreSQL vs Memory)
- Authentication attempts
- Session creation/restoration

---

## 🔐 Security Notes

1. **Change Default Admin Password:**
   - Default: Check `ADMIN_PASSWORD` in secrets
   - Login: `admin@islandloaf.com`
   - Change password immediately after first login

2. **Rotate Session Secret:**
   - Generate new `SESSION_SECRET` periodically
   - Note: This will log out all users

3. **Database Credentials:**
   - Never commit `.env` file to Git
   - Keep Supabase passwords secure
   - Use connection pooler in production

---

## 📝 Environment Variable Reference

See `env.example` for complete documentation of all environment variables.

**Quick Reference:**
- `SUPABASE_DB_URL`: Primary database connection (pooler, port 6543)
- `DATABASE_URL`: Fallback database connection (direct, port 5432)
- `SESSION_SECRET`: Encryption key for session cookies (32+ chars)
- `NODE_ENV`: Set to `production` for Replit deployment
- `ADMIN_PASSWORD`: Password for admin@islandloaf.com
- `PORT`: Server port (default: 5000)
- `OPENAI_API_KEY`: Optional, for AI features

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Server starts without database connection errors
2. ✅ Users can login successfully
3. ✅ Sessions persist across page refreshes
4. ✅ Sessions persist after browser close/reopen
5. ✅ Database health check passes on startup
6. ✅ Session table exists in Supabase
7. ✅ No auto-logout on tab switching

---

## 🆘 Need Help?

If you encounter issues:

1. Check Replit Console logs for error messages
2. Verify all required secrets are set
3. Test database connection from Supabase dashboard
4. Review `env.example` for configuration reference
5. Check browser DevTools Console for frontend errors

---

## 📚 Additional Resources

- **Supabase Documentation:** [supabase.com/docs](https://supabase.com/docs)
- **Replit Deployment:** [docs.replit.com/hosting/deployments](https://docs.replit.com/hosting/deployments)
- **Express Sessions:** [github.com/expressjs/session](https://github.com/expressjs/session)

---

**Last Updated:** January 2026
**Version:** 2.0 (Login Persistence Fix)

