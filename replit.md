# IslandLoaf Tourism Platform

## Overview

IslandLoaf is a comprehensive tourism booking platform designed for Sri Lanka with global expansion potential. It serves as a marketplace connecting tourism vendors (accommodation providers, tour operators, transport companies, wellness centers) with travelers through an intelligent booking system. The platform features both vendor and admin dashboards, AI-powered marketing tools, and advanced booking management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Storage Layer**: PostgreSQL database with Drizzle ORM (fully migrated from in-memory)
- **Authentication**: Session-based with JWT support for API access
- **Database**: Supabase PostgreSQL with Drizzle ORM (migrated from Neon)
- **AI Integration**: OpenAI API for content generation and booking optimization

### Deployment Strategy
- **Platform**: Replit with autoscale deployment
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **Environment**: Node.js 20 runtime environment
- **Static Assets**: Served through Vite middleware in development, static build in production

## Key Components

### User Management System
- **Role-based Access Control**: Vendor and admin roles with different permissions
- **Business Type Categories**: Supports stays, vehicles, tours, wellness, tickets, and products
- **Flexible Authorization**: Category-based permissions for vendors

### Booking Management Engine
- **Multi-category Support**: Handles different booking types with specialized forms
- **Dynamic Pricing**: Base pricing with extensible pricing rules system
- **Status Tracking**: Complete booking lifecycle management (pending, confirmed, completed, cancelled, refunded)
- **Calendar Integration**: iCal sync support for external calendar platforms

### AI-Powered Features
- **Marketing Content Generation**: AI-generated social media posts, descriptions, and promotional content
- **Booking Optimization**: Intelligent recommendations based on customer requirements
- **Vendor Analytics**: SWOT analysis and performance insights
- **Customer Feedback Analysis**: Sentiment analysis and business intelligence

### Dashboard System
- **Vendor Dashboard**: Booking management, calendar sync, pricing controls, AI marketing tools
- **Admin Dashboard**: Platform monitoring, vendor management, analytics and reporting
- **Real-time Analytics**: Revenue tracking, booking sources, customer demographics

## Data Flow

### Storage Provider Pattern
The application uses a flexible storage provider that switches between in-memory storage (development) and PostgreSQL (production) based on environment configuration. This allows for easy development and testing while maintaining production scalability.

### Authentication Flow
1. Session-based authentication for web interface
2. JWT token support for API access and external integrations
3. Role-based route protection with middleware validation
4. Automatic session management with secure cookie handling

### Booking Creation Flow
1. Category selection based on vendor permissions
2. Specialized form rendering for booking type
3. Validation using Zod schemas
4. Database persistence with relationship management
5. Notification system for booking updates

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Drizzle ORM and Prisma client
- **AI Services**: OpenAI API for content generation and analytics
- **UI Components**: Radix UI primitives with Shadcn/ui styling
- **Development**: TypeScript, Vite, ESBuild for build processes

### Third-party Integrations
- **Calendar Sync**: iCal format support for external calendar platforms
- **Payment Processing**: Stripe integration (configured but not fully implemented)
- **Monitoring**: Custom logging with Winston and request tracking

### Development Tools
- **Type Safety**: Comprehensive TypeScript coverage with strict mode
- **Validation**: Zod schemas for runtime type checking
- **Testing**: Built-in testing infrastructure with automated booking tests
- **Code Quality**: ESLint and Prettier configuration

## Deployment Strategy

### Development Environment
- **Local Development**: Hot module replacement with Vite dev server
- **Database**: Switchable between in-memory (quick start) and PostgreSQL
- **Environment Variables**: Comprehensive .env configuration
- **Port Configuration**: Default port 5000 with external port mapping

### Production Deployment
- **Build Process**: Frontend static build with backend bundling
- **Database Migration**: Automated schema deployment with Prisma
- **Environment Scaling**: Replit autoscale with load balancing
- **Asset Optimization**: Vite production optimizations with code splitting

### Migration Support
- **Data Migration**: Scripts for transferring between storage systems
- **Database Initialization**: Automated schema setup and seed data
- **Backup Strategy**: Comprehensive data export and import utilities

## Changelog

- January 12, 2026. Production deployment fixes: SSL config respects PGSSLMODE env var, added graceful shutdown handlers for session pool, fixed getRecentBookings with SQL ordering, filtered getCalendarEvents for valid dates
- January 12, 2026. Fixed session management by switching to memory-based sessions (memorystore) - Resolved Supabase connection timeout issues while maintaining Supabase for data storage
- January 12, 2026. Migrated database from Neon to Supabase PostgreSQL - Updated SUPABASE_DB_URL connection, enabled trust proxy for rate limiting, created session table for production-ready sessions
- August 19, 2025. Successfully implemented unified authentication and storage system - Fixed all critical security vulnerabilities and database storage errors
- August 19, 2025. Created single consistent auth stack with PostgreSQL session storage, bcrypt password hashing, and unified login/logout functionality
- August 19, 2025. Eliminated database-storage errors and replaced with direct Drizzle ORM functions for robust data persistence
- July 26, 2025. Removed demo credentials and updated contact to info@islandloafvendor.com for production deployment
- July 26, 2025. Implemented security fixes for AI prompt injection vulnerability
- July 13, 2025. Successfully migrated from Replit Agent to Replit environment with PostgreSQL database
- July 13, 2025. Completed vendor management CRUD operations with real-time UI updates
- June 17, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.