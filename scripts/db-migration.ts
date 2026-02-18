/**
 * IslandLoaf Database Migration Script
 * This script transfers data from in-memory storage to PostgreSQL
 */

import { storage } from '../server/storage';
import prisma from '../server/prisma-client';

/**
 * Main migration function to transfer all data from MemStorage to PostgreSQL
 */
async function migrateDataToPostgres() {
  console.log('🔄 Starting database migration to PostgreSQL...');
  
  try {
    // Migrate Users
    await migrateUsers();
    
    // Migrate Services
    await migrateServices();
    
    // Migrate Calendar Events and Sources
    await migrateCalendarData();
    
    // Migrate Bookings
    await migrateBookings();
    
    // Migrate Notifications
    await migrateNotifications();
    
    // Migrate Marketing Content
    await migrateMarketingContent();
    
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Migrate users from in-memory storage to PostgreSQL
 */
async function migrateUsers() {
  console.log('📋 Migrating users...');
  const users = await storage.getUsers();
  
  for (const user of users) {
    // Map categoriesAllowed to JSON type
    const categoriesAllowed = user.categoriesAllowed || [];
    
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        username: user.username,
        password: user.password,
        email: user.email,
        fullName: user.fullName,
        businessName: user.businessName,
        businessType: user.businessType,
        role: user.role,
        categoriesAllowed: categoriesAllowed,
        createdAt: user.createdAt
      },
      create: {
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        fullName: user.fullName,
        businessName: user.businessName,
        businessType: user.businessType,
        role: user.role,
        categoriesAllowed: categoriesAllowed,
        createdAt: user.createdAt
      }
    });
  }
  
  console.log(`✅ Migrated ${users.length} users`);
}

/**
 * Migrate services from in-memory storage to PostgreSQL
 */
async function migrateServices() {
  console.log('📋 Migrating services...');
  let count = 0;
  
  for (const user of await storage.getUsers()) {
    const services = await storage.getServices(user.id);
    
    for (const service of services) {
      await prisma.service.upsert({
        where: { id: service.id },
        update: {
          userId: service.userId,
          name: service.name,
          description: service.description,
          type: service.type,
          basePrice: service.basePrice,
          available: service.available,
          createdAt: service.createdAt
        },
        create: {
          id: service.id,
          userId: service.userId,
          name: service.name,
          description: service.description,
          type: service.type,
          basePrice: service.basePrice,
          available: service.available,
          createdAt: service.createdAt
        }
      });
      count++;
    }
  }
  
  console.log(`✅ Migrated ${count} services`);
}

/**
 * Migrate calendar events and sources from in-memory storage to PostgreSQL
 */
async function migrateCalendarData() {
  console.log('📋 Migrating calendar data...');
  let eventCount = 0;
  let sourceCount = 0;
  
  for (const user of await storage.getUsers()) {
    // Migrate calendar events
    const events = await storage.getCalendarEvents(user.id);
    
    for (const event of events) {
      await prisma.calendarEvent.upsert({
        where: { id: event.id },
        update: {
          userId: event.userId,
          serviceId: event.serviceId,
          startDate: event.startDate,
          endDate: event.endDate,
          title: event.title,
          isBooked: event.isBooked,
          isPending: event.isPending,
          isBlocked: event.isBlocked,
          source: event.source,
          externalId: event.externalId,
          createdAt: event.createdAt
        },
        create: {
          id: event.id,
          userId: event.userId,
          serviceId: event.serviceId,
          startDate: event.startDate,
          endDate: event.endDate,
          title: event.title,
          isBooked: event.isBooked,
          isPending: event.isPending,
          isBlocked: event.isBlocked,
          source: event.source,
          externalId: event.externalId,
          createdAt: event.createdAt
        }
      });
      eventCount++;
    }
    
    // Migrate calendar sources
    const sources = await storage.getCalendarSources(user.id);
    
    for (const source of sources) {
      await prisma.calendarSource.upsert({
        where: { id: source.id },
        update: {
          userId: source.userId,
          serviceId: source.serviceId,
          name: source.name,
          url: source.url,
          type: source.type,
          lastSynced: source.lastSynced,
          createdAt: source.createdAt
        },
        create: {
          id: source.id,
          userId: source.userId,
          serviceId: source.serviceId,
          name: source.name,
          url: source.url,
          type: source.type,
          lastSynced: source.lastSynced,
          createdAt: source.createdAt
        }
      });
      sourceCount++;
    }
  }
  
  console.log(`✅ Migrated ${eventCount} calendar events and ${sourceCount} calendar sources`);
}

/**
 * Migrate bookings from in-memory storage to PostgreSQL
 */
async function migrateBookings() {
  console.log('📋 Migrating bookings...');
  let count = 0;
  
  for (const user of await storage.getUsers()) {
    const bookings = await storage.getBookings(user.id);
    
    for (const booking of bookings) {
      // Parse the booking details from string to JSON if needed
      let details = null;
      if (typeof booking.details === 'string') {
        try {
          details = JSON.parse(booking.details);
        } catch (e) {
          console.warn(`Failed to parse booking details for booking ${booking.id}`);
          details = { raw: booking.details };
        }
      } else {
        details = booking.details;
      }
      
      await prisma.booking.upsert({
        where: { id: booking.id },
        update: {
          userId: booking.userId,
          serviceId: booking.serviceId,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone || null,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: booking.status,
          totalPrice: booking.totalPrice,
          commission: booking.commission,
          notes: booking.notes || null,
          details: details,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        },
        create: {
          id: booking.id,
          userId: booking.userId,
          serviceId: booking.serviceId,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone || null,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: booking.status,
          totalPrice: booking.totalPrice,
          commission: booking.commission,
          notes: booking.notes || null,
          details: details,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        }
      });
      count++;
    }
  }
  
  console.log(`✅ Migrated ${count} bookings`);
}

/**
 * Migrate notifications from in-memory storage to PostgreSQL
 */
async function migrateNotifications() {
  console.log('📋 Migrating notifications...');
  let count = 0;
  
  for (const user of await storage.getUsers()) {
    const notifications = await storage.getNotifications(user.id);
    
    for (const notification of notifications) {
      await prisma.notification.upsert({
        where: { id: notification.id },
        update: {
          userId: notification.userId,
          title: notification.title,
          message: notification.message || notification.content, // Handle both field names
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt
        },
        create: {
          id: notification.id,
          userId: notification.userId,
          title: notification.title,
          message: notification.message || notification.content, // Handle both field names
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt
        }
      });
      count++;
    }
  }
  
  console.log(`✅ Migrated ${count} notifications`);
}

/**
 * Migrate marketing content from in-memory storage to PostgreSQL
 */
async function migrateMarketingContent() {
  console.log('📋 Migrating marketing content...');
  let count = 0;
  
  for (const user of await storage.getUsers()) {
    const contents = await storage.getMarketingContents(user.id);
    
    for (const content of contents) {
      await prisma.marketingContent.upsert({
        where: { id: content.id },
        update: {
          userId: content.userId,
          serviceId: content.serviceId,
          title: content.title,
          content: content.content,
          contentType: content.contentType || content.type, // Handle both field names
          serviceDescription: content.serviceDescription || null,
          targetAudience: content.targetAudience || null,
          tone: content.tone || null,
          createdAt: content.createdAt
        },
        create: {
          id: content.id,
          userId: content.userId,
          serviceId: content.serviceId,
          title: content.title,
          content: content.content,
          contentType: content.contentType || content.type, // Handle both field names
          serviceDescription: content.serviceDescription || null,
          targetAudience: content.targetAudience || null,
          tone: content.tone || null,
          createdAt: content.createdAt
        }
      });
      count++;
    }
  }
  
  console.log(`✅ Migrated ${count} marketing content items`);
}

// Run the migration if this script is called directly
if (require.main === module) {
  migrateDataToPostgres()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateDataToPostgres };