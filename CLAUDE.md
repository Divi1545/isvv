# CLAUDE.md — IslandLoaf Vendor Platform (isvv)

## Owner
Divindu Edirisinghe — AI Code Agency Pvt Ltd, Sri Lanka

## What This Project Is
The core backend for IslandLoaf — a Sri Lankan tourism marketplace.
Vendors register here, list services, manage bookings, calendars, pricing, and marketing.
This is the engine that powers everything else in the IslandLoaf ecosystem.

## Tech Stack
- Frontend: React + Tailwind + Shadcn UI
- Backend: Express + TypeScript
- Database: PostgreSQL via Supabase
- ORM: Prisma + Drizzle
- Payments: Stripe Connect
- AI: Anthropic Claude API (claude-sonnet-4-6) — NEVER use OpenAI
- Hosting: Railway (backend), Vercel (frontend)

## Database Models
Users, Services, Bookings, CalendarEvents, CalendarSources, Notifications, MarketingContent, PricingRules, SystemSettings

## Service Types
stay, transport, tour, wellness, ticket, product

## Environment Variables Required
- DATABASE_URL (Supabase PostgreSQL)
- ANTHROPIC_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- SESSION_SECRET
- NODE_ENV
- PORT=3000

## Connected Platforms
- IslandLoaf Stay (islandloafstay.com) — pulls vendor services via API
- Moments by IslandLoaf — experiences layer
- Creator Platform — influencer marketing
- Authority13 — AI agent automation layer

## Current Priorities
1. Keep deployed on Railway, stable and live
2. All AI features use Claude API only
3. Support LKR currency for Sri Lankan market
4. Vendor onboarding must be automated
5. Booking confirmations auto-sent via email

## Rules for Claude
- Always use Anthropic Claude API (claude-sonnet-4-6), never OpenAI
- After completing any task, push changes to GitHub (Divi1545/isvv)
- Optimize for Sri Lankan market context
- Think in systems — automate everything possible
- Keep API endpoints RESTful and documented
- Never break existing vendor data or bookings
