# IslandLoaf Developer & Admin Onboarding Guide

## 1. System Overview

IslandLoaf is a comprehensive tourism platform built for Sri Lanka (with potential global expansion), connecting vendors with travelers through an intelligent booking system. The platform consists of:

- **Vendor Dashboard**: Manage listings, bookings, pricing, and calendar availability
- **Admin Dashboard**: Monitor platform health, manage vendors, and generate reports
- **Booking Management**: Support for multiple categories (Stays, Transport, Tours, Wellness, Products)
- **Role-Based Access**: Separate interfaces and permissions for vendors and admins
- **Pricing Engine**: Dynamic pricing based on property type, dates, and guest count
- **Calendar Sync**: Integration with iCal to sync availability from external platforms
- **PostgreSQL with Prisma**: Scalable database solution with easy migration path

## 2. Project Structure

```
/client/src           - React frontend components and pages
  /components         - Reusable UI components (buttons, cards, etc.)
  /pages              - Main application pages
    /admin            - Admin-specific pages
    /vendor           - Vendor-specific pages
    /dashboard        - Shared dashboard components
  /hooks              - Custom React hooks
  /lib                - Utility functions and API clients
  /context            - React context providers
  
/server               - Express backend API
  /storage            - Data storage implementations
  /routes.ts          - API endpoint definitions
  /storage.ts         - Memory storage implementation
  /database-storage.ts - PostgreSQL storage implementation
  /storage-provider.ts - Storage selection module
  
/prisma               - Database schema and migrations
  /schema.prisma      - Prisma schema definition
  
/scripts              - Utility and automation scripts
  /db-migration.ts    - Data migration script
  /db-init.ts         - Database initialization script
  /always-on.js       - Backend uptime script
  
/shared               - Shared code between frontend and backend
  /schema.ts          - Data models and Zod validation schemas
```

## 3. Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure:
   ```
   # Storage type: "memory" or "postgres"
   STORAGE_TYPE=memory
   
   # Database connection
   DATABASE_URL="postgresql://username:password@host:port/database"
   
   # JWT Secret for authentication
   JWT_SECRET=your_secure_jwt_secret_key
   
   # Session configuration
   SESSION_SECRET=your_secure_session_secret
   
   # Server configuration
   PORT=5000
   NODE_ENV=development
   
   # API Keys (if needed)
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. If using PostgreSQL, set up the database:
   ```bash
   npx prisma migrate dev
   ```

## 4. Running Locally

Start the development server:
```bash
npm run dev
```

This starts both the frontend and backend services. The application will be available at:
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

## 5. Admin Dashboard Access

1. Login with admin credentials:
   ```
   Email: admin@islandloaf.com
   Password: admin123
   ```

2. Admin capabilities:
   - View platform statistics (bookings, revenue, vendor activity)
   - Manage vendors (approve, suspend, view details)
   - Access booking data across all vendors
   - Generate and download reports (CSV)
   - View and manage support tickets
   - Launch marketing campaigns and promotions

## 6. Vendor Dashboard Access

1. Register as a new vendor or contact support:
   ```
   Support: info@islandloafvendor.com
   ```

2. Vendor capabilities:
   - Manage listings and services
   - Set pricing and availability
   - Process bookings
   - Sync calendar with external platforms
   - View analytics and reporting
   - Use AI-powered marketing content generation
   - Connect to the marketplace

## 7. Authentication System

IslandLoaf uses a token-based authentication system:
- Tokens are stored in localStorage with expiration timestamps
- "Remember Me" option extends token life from 1 day to 7 days
- Auto-logout with notification when session expires
- User sessions track role-based permissions

## 8. Storage System Architecture

The platform supports two storage implementations:

### Memory Storage (`MemStorage`)
- Default for development
- Data stored in-memory with Maps
- Fast but volatile - data is lost on server restart
- Set `STORAGE_TYPE=memory` in `.env`

### PostgreSQL Storage (`DatabaseStorage`)
- Production-ready persistent storage
- Uses Prisma ORM for database operations
- Maintains the same interface as MemStorage
- Set `STORAGE_TYPE=postgres` in `.env`

To migrate from memory to PostgreSQL:
1. Ensure PostgreSQL is set up and accessible
2. Update `DATABASE_URL` in `.env`
3. Run the migration script: `npx tsx scripts/db-migration.ts`
4. Switch storage type: `STORAGE_TYPE=postgres`

## 9. Deployment

### Backend Deployment
- Deployed on Replit with seamless GitHub integration
- For production, use Replit Boosted plan or migrate to:
  - Railway
  - Render
  - Vercel (serverless functions)

### Frontend Deployment
- Automatically deployed with the backend in Replit
- Alternatively can be deployed to Vercel for improved performance

### Keeping the Backend Always On
- Use the provided script: `node scripts/always-on.js`
- Set up an external monitoring service (UptimeRobot, Pingdom)
- For production, use a dedicated hosting provider

## 10. Testing

Run unit tests:
```bash
npm test
```

Run end-to-end tests:
```bash
npm run test:e2e
```

## 11. Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check PostgreSQL server is running
   - Ensure network permissions allow the connection

2. **API Error Responses**
   - Check server logs for detailed error information
   - Verify authentication tokens are valid
   - Ensure request data matches expected schema

3. **Calendar Sync Failures**
   - Verify iCal URL is valid and accessible
   - Check for firewall restrictions
   - Ensure the calendar source is properly formatted

## 12. Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Express.js Documentation](https://expressjs.com/)