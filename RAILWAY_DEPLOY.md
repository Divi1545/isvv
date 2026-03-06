# Railway Deployment Guide — IslandLoaf Vendor Platform

## Pre-flight Checklist

Before deploying, you need:
- [ ] Supabase project created (free tier works) — get your DB URL + API keys
- [ ] OpenAI API key (for AI agents)
- [ ] Stripe account with Connect enabled (for vendor payouts)
- [ ] A strong random `SESSION_SECRET`

---

## Step 1 — Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/islandloaf-vendor.git
git push -u origin main
```

> **Important:** Make sure `.env` is in your `.gitignore` — never commit real secrets.

---

## Step 2 — Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select your repo
4. Railway will auto-detect Node.js and use `railway.toml` for build/start commands

---

## Step 3 — Add Environment Variables

In Railway dashboard → your service → **Variables**, add ALL of these:

### Required (app won't start without these)

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` or `SUPABASE_DB_URL` | Supabase → Settings → Database → Connection string (Transaction pooler) |
| `SESSION_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ADMIN_EMAIL` | Your admin email |
| `ADMIN_PASSWORD` | Your admin password |
| `NODE_ENV` | Set to `production` |

### Supabase (required for image uploads)

| Variable | Where to get it |
|----------|----------------|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |

### AI Features

| Variable | Where to get it |
|----------|----------------|
| `OPENAI_API_KEY` | platform.openai.com → API Keys |

### Stripe Payments

| Variable | Where to get it |
|----------|----------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Add endpoint → signing secret |

### Optional

| Variable | Value |
|----------|-------|
| `AGENT_RUNNER_ENABLED` | `true` to enable background AI agents |
| `TELEGRAM_BOT_TOKEN` | From @BotFather on Telegram |
| `APP_URL` | Your Railway public URL (set after first deploy) |

---

## Step 4 — Database Setup (Supabase)

Run these SQL scripts in your Supabase SQL editor (in order):

1. **`PASTE_THIS_IN_SUPABASE.sql`** — main schema
2. **`FIX_SECURITY_AND_PERFORMANCE.sql`** — indexes & RLS policies

Then seed the default users via Railway's **Railway Shell** or locally:

```bash
# From your local machine with .env filled in:
npm run db:push
```

---

## Step 5 — Set Up Stripe Webhook

After deploying, get your Railway URL (e.g. `https://xyz.railway.app`) and:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.railway.app/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `account.updated`, `transfer.created`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in Railway

---

## Step 6 — Verify Deployment

After deploy completes, check:

```
GET https://your-app.railway.app/health        → should return "OK"
GET https://your-app.railway.app/api/health    → should return JSON with status: "healthy"
```

Login at: `https://your-app.railway.app/login`

---

## Deployment Architecture

```
Railway Build:
  npm install          ← installs all deps + runs prisma generate (postinstall)
  npm run build        ← vite build (frontend → dist/) + esbuild (server → dist/index.js)

Railway Start:
  node dist/index.js   ← serves API + static frontend from dist/
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot find index.html` | Build didn't complete — check build logs |
| `SUPABASE_DB_URL or DATABASE_URL is not set` | Add the env variable in Railway dashboard |
| `Session not persisting` | Ensure `SESSION_SECRET` is set and DB is connected |
| `Stripe webhook failing` | Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard |
| `AI agents not working` | Check `OPENAI_API_KEY` is valid |
| `Login loop` | Run `npm run db:push` to ensure user table exists |

---

## Custom Domain

1. Railway → your service → **Settings → Domains → Add Custom Domain**
2. Add DNS CNAME record pointing to Railway's provided hostname
3. Railway handles SSL automatically
4. Update `APP_URL` env var to your custom domain
