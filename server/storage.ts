// server/storage.ts
// Re-export Supabase-based storage functions
// This maintains compatibility with existing route imports

export {
  // User methods
  getUserByEmail,
  getUserByUsername,
  getUser,
  createUser,
  updateUser,
  getAllUsers,
  deleteUser,
  getUsers,
  
  // Service methods
  createService,
  getService,
  getServices,
  updateService,
  deleteService,
  
  // Booking methods
  createBooking,
  getBooking,
  getBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
  getRecentBookings,
  
  // Notification methods
  createNotification,
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  
  // Calendar methods
  getCalendarSources,
  createCalendarSource,
  updateCalendarSource,
  deleteCalendarSource,
  getCalendarEvents,
  
  // Review methods
  getReviews,
  
  // Pricing methods
  getPricingRules,
  
  // Dashboard methods
  getDashboardStats,
  
  // Marketing content methods
  createMarketingContent,
  getMarketingContents,
  deleteMarketingContent,
  
  // Support ticket methods
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  
  // Room type methods
  getRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  
  // API key methods
  createApiKey,
  getApiKeys,
  getApiKeyByKey,
  updateApiKey,
  deleteApiKey,
  revokeApiKey,
  
  // Types
  type CreateUserInput,
  type UpdateUserInput,
  type CreateServiceInput,
  type CreateBookingInput,
  type CreateNotificationInput,
} from './supabase-storage';

// Legacy compatibility - IStorage interface for memory storage fallback
export interface IStorage {
  getUserByEmail: (email: string) => Promise<any>;
  getUser: (id: number) => Promise<any>;
  createUser: (input: any) => Promise<any>;
  updateUser: (id: number, patch: any) => Promise<any>;
  getAllUsers: () => Promise<any[]>;
  deleteUser: (id: number) => Promise<any>;
  createService: (input: any) => Promise<any>;
  getService: (id: number) => Promise<any>;
  getServices: (vendorId?: number) => Promise<any[]>;
  updateService: (id: number, patch: any) => Promise<any>;
  createBooking: (input: any) => Promise<any>;
  getBooking: (id: number) => Promise<any>;
  getBookings: (vendorId?: number) => Promise<any[]>;
  updateBooking: (id: number, patch: any) => Promise<any>;
  deleteBooking: (id: number) => Promise<any>;
}

// Memory storage for development/fallback
export class MemStorage implements IStorage {
  private users: Map<number, any> = new Map();
  private services: Map<number, any> = new Map();
  private bookings: Map<number, any> = new Map();
  private userId = 1;
  private serviceId = 1;
  private bookingId = 1;

  async getUserByEmail(email: string) {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) return user;
    }
    return null;
  }

  async getUser(id: number) {
    return this.users.get(id) || null;
  }

  async createUser(input: any) {
    const user = { id: this.userId++, ...input, createdAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, patch: any) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...patch };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers() {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number) {
    const user = this.users.get(id);
    if (!user) return null;
    this.users.delete(id);
    return user;
  }

  async createService(input: any) {
    const service = { id: this.serviceId++, ...input, createdAt: new Date() };
    this.services.set(service.id, service);
    return service;
  }

  async getService(id: number) {
    return this.services.get(id) || null;
  }

  async getServices(vendorId?: number) {
    const services = Array.from(this.services.values());
    if (vendorId && vendorId !== 0) {
      return services.filter(s => s.userId === vendorId);
    }
    return services;
  }

  async updateService(id: number, patch: any) {
    const service = this.services.get(id);
    if (!service) return null;
    const updated = { ...service, ...patch };
    this.services.set(id, updated);
    return updated;
  }

  async createBooking(input: any) {
    const booking = { id: this.bookingId++, ...input, createdAt: new Date() };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async getBooking(id: number) {
    return this.bookings.get(id) || null;
  }

  async getBookings(vendorId?: number) {
    const bookings = Array.from(this.bookings.values());
    if (vendorId && vendorId !== 0) {
      return bookings.filter(b => b.userId === vendorId);
    }
    return bookings;
  }

  async updateBooking(id: number, patch: any) {
    const booking = this.bookings.get(id);
    if (!booking) return null;
    const updated = { ...booking, ...patch };
    this.bookings.set(id, updated);
    return updated;
  }

  async deleteBooking(id: number) {
    const booking = this.bookings.get(id);
    if (!booking) return null;
    this.bookings.delete(id);
    return booking;
  }
}
