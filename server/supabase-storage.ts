// server/supabase-storage.ts
// Storage layer using PostgreSQL to interact with the IslandLoaf database
// Auth functions (getUserByEmail, getUser, getUserByUsername) use direct PostgreSQL for reliability
// Other functions use Supabase JS client for consistency

import { pool } from './db';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import bcrypt from 'bcryptjs';

// Helper function to map snake_case DB columns to camelCase
function mapUserRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    password: row.password,
    fullName: row.full_name,
    businessName: row.business_name,
    businessType: row.business_type,
    role: row.role,
    categoriesAllowed: row.categories_allowed || [],
    createdAt: row.created_at
  };
}

// Helper to get the Supabase admin client for non-auth functions
function getClient() {
  if (!isSupabaseConfigured()) {
    console.warn('[STORAGE] Supabase is not configured, using fallback behavior');
    throw new Error('Supabase is not configured. Please check environment variables.');
  }
  return getSupabaseAdmin();
}

// ==================== USER / VENDOR METHODS ====================

export interface CreateUserInput {
  email: string;
  username?: string;
  password: string; // will be hashed
  fullName: string;
  businessName: string;
  businessType: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  role?: 'vendor' | 'admin';
  isActive?: boolean;
  categoriesAllowed?: string[];
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  fullName?: string;
  businessName?: string;
  businessType?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  role?: 'vendor' | 'admin';
  isApproved?: boolean;
  isActive?: boolean;
  profileImage?: string;
  commissionRate?: number;
}

export async function getUserByEmail(email: string) {
  console.log('[STORAGE] getUserByEmail called for:', email);
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    
    console.log('[STORAGE] PostgreSQL response:', { rowCount: result.rowCount });
    
    if (result.rows.length === 0) {
      console.log('[STORAGE] No user found');
      return null;
    }
    
    console.log('[STORAGE] User found, mapping data');
    return mapUserRow(result.rows[0]);
  } catch (err: any) {
    console.error('[STORAGE] Exception in getUserByEmail:', err.message);
    return null;
  }
}

export async function getUser(id: number) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return mapUserRow(result.rows[0] || null);
  } catch (err: any) {
    console.error('[STORAGE] Error fetching user:', err.message);
    return null;
  }
}

export async function getUserByUsername(username: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      [username]
    );
    return mapUserRow(result.rows[0] || null);
  } catch (err: any) {
    console.error('[STORAGE] Error fetching user by username:', err.message);
    return null;
  }
}

export async function createUser(input: CreateUserInput) {
  // Hash the password
  const hashedPassword = await bcrypt.hash(input.password, 10);
  
  const { data, error } = await getClient()
    .from('users')
    .insert({
      email: input.email,
      password: hashedPassword,
      full_name: input.fullName,
      business_name: input.businessName,
      business_type: input.businessType,
      phone: input.phone,
      address: input.address,
      city: input.city,
      country: input.country || 'Sri Lanka',
      role: input.role || 'vendor',
      is_approved: false,
      is_active: true,
    })
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw error;
  }
  
  return data;
}

export async function updateUser(id: number, patch: UpdateUserInput) {
  const updateData: Record<string, any> = {};
  
  if (patch.email) updateData.email = patch.email;
  if (patch.password) updateData.password = await bcrypt.hash(patch.password, 10);
  if (patch.fullName) updateData.full_name = patch.fullName;
  if (patch.businessName) updateData.business_name = patch.businessName;
  if (patch.businessType) updateData.business_type = patch.businessType;
  if (patch.phone) updateData.phone = patch.phone;
  if (patch.address) updateData.address = patch.address;
  if (patch.city) updateData.city = patch.city;
  if (patch.country) updateData.country = patch.country;
  if (patch.role) updateData.role = patch.role;
  if (patch.isApproved !== undefined) updateData.is_approved = patch.isApproved;
  if (patch.isActive !== undefined) updateData.is_active = patch.isActive;
  if (patch.profileImage) updateData.profile_image = patch.profileImage;
  if (patch.commissionRate !== undefined) updateData.commission_rate = patch.commissionRate;
  
  const { data, error } = await getClient()
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllUsers() {
  const { data, error } = await getClient()
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function deleteUser(id: number) {
  const { data, error } = await getClient()
    .from('users')
    .delete()
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== SERVICE METHODS ====================

export interface CreateServiceInput {
  userId: number;
  name: string;
  description?: string;
  type: string;
  basePrice: number;
  currency?: string;
  available?: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  amenities?: string[];
  maxCapacity?: number;
  cancellationPolicy?: string;
  instantBooking?: boolean;
}

export async function createService(input: CreateServiceInput) {
  const { data, error } = await getClient()
    .from('services')
    .insert({
      user_id: input.userId,
      name: input.name,
      description: input.description,
      type: input.type,
      base_price: input.basePrice,
      currency: input.currency || 'USD',
      available: input.available ?? true,
      location: input.location,
      images: input.images || [],
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getService(id: number) {
  const { data, error } = await getClient()
    .from('services')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching service:', error);
  }
  return data ? mapServiceRow(data) : null;
}

function mapServiceRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || '',
    type: row.type,
    basePrice: row.base_price ?? 0,
    currency: row.currency || 'USD',
    available: row.available ?? true,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    images: row.images || [],
    imageUrl: row.image_url,
    amenities: row.amenities || [],
    maxCapacity: row.max_capacity,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getServices(vendorId?: number) {
  let query = getClient()
    .from('services')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (vendorId && vendorId !== 0) {
    query = query.eq('user_id', vendorId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return (data || []).map(mapServiceRow);
}

export async function updateService(id: number, patch: Partial<CreateServiceInput>) {
  const updateData: Record<string, any> = {};
  
  if (patch.name) updateData.name = patch.name;
  if (patch.description !== undefined) updateData.description = patch.description;
  if (patch.type) updateData.type = patch.type;
  if (patch.basePrice !== undefined) updateData.base_price = patch.basePrice;
  if (patch.currency) updateData.currency = patch.currency;
  if (patch.available !== undefined) updateData.available = patch.available;
  if (patch.location !== undefined) updateData.location = patch.location;
  if (patch.latitude !== undefined) updateData.latitude = patch.latitude;
  if (patch.longitude !== undefined) updateData.longitude = patch.longitude;
  if (patch.images) updateData.images = patch.images;
  if (patch.amenities) updateData.amenities = patch.amenities;
  if (patch.maxCapacity !== undefined) updateData.max_capacity = patch.maxCapacity;
  if (patch.cancellationPolicy !== undefined) updateData.cancellation_policy = patch.cancellationPolicy;
  if (patch.instantBooking !== undefined) updateData.instant_booking = patch.instantBooking;
  
  const { data, error } = await getClient()
    .from('services')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteService(id: number) {
  const { data, error } = await getClient()
    .from('services')
    .delete()
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== BOOKING METHODS ====================

export interface CreateBookingInput {
  userId: number;
  serviceId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCountry?: string;
  guestsCount?: number;
  startDate: string;
  endDate?: string;
  nightsCount?: number;
  totalPrice: number;
  notes?: string;
  specialRequests?: string;
}

export async function createBooking(input: CreateBookingInput) {
  // Generate booking reference - will be auto-generated by trigger, but we'll provide a fallback
  const bookingRef = `BK${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-6)}`;
  
  const { data, error } = await getClient()
    .from('bookings')
    .insert({
      booking_reference: bookingRef,
      user_id: input.userId,
      service_id: input.serviceId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      customer_country: input.customerCountry,
      guests_count: input.guestsCount || 1,
      start_date: input.startDate,
      end_date: input.endDate,
      nights_count: input.nightsCount,
      total_price: input.totalPrice,
      notes: input.notes,
      special_requests: input.specialRequests,
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getBooking(id: number) {
  const { data, error } = await getClient()
    .from('bookings')
    .select('*, services(*), users(*)')
    .eq('id', id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching booking:', error);
  }
  return data || null;
}

export async function getBookings(vendorId?: number) {
  let query = getClient()
    .from('bookings')
    .select('*, services(name, type)')
    .order('created_at', { ascending: false });
  
  if (vendorId && vendorId !== 0) {
    query = query.eq('user_id', vendorId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function updateBooking(id: number, patch: Partial<CreateBookingInput> & { status?: string; paymentStatus?: string }) {
  const updateData: Record<string, any> = {};
  
  if (patch.customerName) updateData.customer_name = patch.customerName;
  if (patch.customerEmail) updateData.customer_email = patch.customerEmail;
  if (patch.customerPhone !== undefined) updateData.customer_phone = patch.customerPhone;
  if (patch.customerCountry !== undefined) updateData.customer_country = patch.customerCountry;
  if (patch.guestsCount !== undefined) updateData.guests_count = patch.guestsCount;
  if (patch.startDate) updateData.start_date = patch.startDate;
  if (patch.endDate !== undefined) updateData.end_date = patch.endDate;
  if (patch.nightsCount !== undefined) updateData.nights_count = patch.nightsCount;
  if (patch.totalPrice !== undefined) updateData.total_price = patch.totalPrice;
  if (patch.notes !== undefined) updateData.notes = patch.notes;
  if (patch.specialRequests !== undefined) updateData.special_requests = patch.specialRequests;
  if (patch.status) updateData.status = patch.status;
  if (patch.paymentStatus) updateData.payment_status = patch.paymentStatus;
  
  const { data, error } = await getClient()
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteBooking(id: number) {
  const { data, error } = await getClient()
    .from('bookings')
    .delete()
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getRecentBookings(limit: number = 10) {
  const { data, error } = await getClient()
    .from('bookings')
    .select('*, services(name, type)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

// ==================== NOTIFICATION METHODS ====================

export interface CreateNotificationInput {
  userId: number;
  title: string;
  message: string;
  type?: string;
  category?: string;
  link?: string;
  read?: boolean;
}

export async function createNotification(input: CreateNotificationInput) {
  const { data, error } = await getClient()
    .from('notifications')
    .insert({
      user_id: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      category: input.category || 'system',
      link: input.link,
      is_read: input.read ?? false,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUnreadNotifications(userId: number) {
  const { data, error } = await getClient()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getNotifications(userId: number) {
  const { data, error } = await getClient()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id: number) {
  const { data, error } = await getClient()
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== CALENDAR METHODS ====================

export async function getCalendarSources(userId: number) {
  const { data, error } = await getClient()
    .from('calendar_sources')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createCalendarSource(input: {
  userId: number;
  serviceId?: number;
  name: string;
  url: string;
  type: string;
}) {
  const { data, error } = await getClient()
    .from('calendar_sources')
    .insert({
      user_id: input.userId,
      service_id: input.serviceId,
      name: input.name,
      url: input.url,
      type: input.type,
      sync_enabled: true,
      is_active: true,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getCalendarEvents(serviceId: number) {
  const { data, error } = await getClient()
    .from('calendar_events')
    .select('*')
    .eq('service_id', serviceId)
    .order('start_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// ==================== REVIEW METHODS ====================

export async function getReviews(serviceId: number) {
  const { data, error } = await getClient()
    .from('reviews')
    .select('*')
    .eq('service_id', serviceId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// ==================== PRICING RULES ====================

export async function getPricingRules(serviceId: number) {
  const { data, error } = await getClient()
    .from('pricing_rules')
    .select('*')
    .eq('service_id', serviceId)
    .eq('is_active', true)
    .order('priority', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats(vendorId: number) {
  // Get bookings count
  let bookingsQuery = getClient()
    .from('bookings')
    .select('*', { count: 'exact', head: true });
  
  if (vendorId !== 0) {
    bookingsQuery = bookingsQuery.eq('user_id', vendorId);
  }
  
  const { count: totalBookings } = await bookingsQuery;
  
  // Get revenue
  let revenueQuery = getClient()
    .from('bookings')
    .select('total_price')
    .eq('payment_status', 'paid');
  
  if (vendorId !== 0) {
    revenueQuery = revenueQuery.eq('user_id', vendorId);
  }
  
  const { data: revenueData } = await revenueQuery;
  const totalRevenue = revenueData?.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) || 0;
  
  // Get pending bookings
  let pendingQuery = getClient()
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  if (vendorId !== 0) {
    pendingQuery = pendingQuery.eq('user_id', vendorId);
  }
  
  const { count: pendingBookings } = await pendingQuery;
  
  // Get services count
  let servicesQuery = getClient()
    .from('services')
    .select('*', { count: 'exact', head: true });
  
  if (vendorId !== 0) {
    servicesQuery = servicesQuery.eq('user_id', vendorId);
  }
  
  const { count: totalServices } = await servicesQuery;
  
  return {
    totalBookings: totalBookings || 0,
    totalRevenue,
    pendingBookings: pendingBookings || 0,
    totalServices: totalServices || 0,
  };
}

// Alias for compatibility
export const getUsers = getAllUsers;

// ==================== ADDITIONAL MISSING FUNCTIONS ====================

// Get all bookings (for admin)
export async function getAllBookings() {
  return getBookings(0);
}

// ==================== CALENDAR SOURCE METHODS ====================

export async function deleteCalendarSource(id: number) {
  const { data, error } = await getClient()
    .from('calendar_sources')
    .delete()
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCalendarSource(id: number, patch: any) {
  const updateData: Record<string, any> = {};
  
  if (patch.name) updateData.name = patch.name;
  if (patch.url) updateData.url = patch.url;
  if (patch.type) updateData.type = patch.type;
  if (patch.syncEnabled !== undefined) updateData.sync_enabled = patch.syncEnabled;
  if (patch.isActive !== undefined) updateData.is_active = patch.isActive;
  
  const { data, error } = await getClient()
    .from('calendar_sources')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== MARKETING CONTENT METHODS ====================

export async function createMarketingContent(input: {
  userId: number;
  serviceId?: number;
  title: string;
  content: string;
  contentType: string;
  serviceDescription?: string;
  targetAudience?: string;
  tone?: string;
}) {
  // Marketing contents table may not exist - stub for now
  console.log('createMarketingContent called:', input);
  return { id: Date.now(), ...input, createdAt: new Date() };
}

export async function getMarketingContents(userId: number) {
  // Marketing contents table may not exist - return empty array
  return [];
}

export async function deleteMarketingContent(id: number) {
  // Marketing contents table may not exist - stub
  console.log('deleteMarketingContent called:', id);
  return { id };
}

// ==================== SUPPORT TICKET METHODS ====================

export async function getSupportTickets(filters?: { status?: string; userId?: number }) {
  // Support tickets table may not exist - return empty array
  return [];
}

export async function getSupportTicket(id: number) {
  // Support tickets table may not exist - return null
  return null;
}

export async function createSupportTicket(input: {
  userId: number;
  vendorName: string;
  subject: string;
  message: string;
  priority?: string;
  category?: string;
}) {
  // Support tickets table may not exist - stub
  console.log('createSupportTicket called:', input);
  return { id: Date.now(), ...input, status: 'open', createdAt: new Date() };
}

export async function updateSupportTicket(id: number, patch: any) {
  // Support tickets table may not exist - stub
  console.log('updateSupportTicket called:', id, patch);
  return { id, ...patch };
}

export async function deleteSupportTicket(id: number) {
  // Support tickets table may not exist - stub
  console.log('deleteSupportTicket called:', id);
  return { id };
}

// ==================== ROOM TYPE METHODS ====================

export async function getRoomTypes(vendorId: number) {
  // Room types table may not exist in Supabase schema - return empty array
  return [];
}

export async function getRoomType(id: number) {
  // Room types table may not exist - return null
  return null;
}

export async function createRoomType(input: {
  vendorId: number;
  name?: string;
  roomTypeName?: string;
  description?: string;
  maxGuests?: number;
  basePrice?: number | string;
  amenities?: string[];
  bedType?: string;
  bedTypes?: string[];
  maxOccupancy?: number;
  numberOfRooms?: number;
  priceModifier?: number;
}) {
  // Room types table may not exist - stub
  console.log('createRoomType called:', input);
  return { 
    id: Date.now(), 
    vendorId: input.vendorId,
    roomTypeName: input.name || input.roomTypeName || 'Standard Room',
    description: input.description || '',
    bedTypes: input.bedTypes || [input.bedType || 'double'],
    numberOfRooms: input.numberOfRooms || input.maxOccupancy || 1,
    amenities: input.amenities || [],
    priceModifier: input.priceModifier || 1.0,
    createdAt: new Date() 
  };
}

export async function updateRoomType(id: number, patch: any) {
  // Room types table may not exist - stub
  console.log('updateRoomType called:', id, patch);
  return { id, ...patch };
}

export async function deleteRoomType(id: number) {
  // Room types table may not exist - stub
  console.log('deleteRoomType called:', id);
  return { id };
}

// ==================== API KEY METHODS ====================

export async function createApiKey(input: { label: string; key: string; active?: boolean }) {
  // API keys may not be in Supabase - stub
  console.log('createApiKey called:', input);
  return { id: Date.now(), ...input, active: input.active ?? true, createdAt: new Date() };
}

export async function getApiKeys() {
  // API keys may not be in Supabase - return empty array
  return [];
}

export async function getApiKeyByKey(key: string) {
  // API keys may not be in Supabase - return null
  return null;
}

export async function updateApiKey(id: number, patch: Partial<{ label: string; active: boolean }>) {
  // API keys may not be in Supabase - stub
  return null;
}

export async function deleteApiKey(id: number) {
  // API keys may not be in Supabase - stub
  return null;
}

export async function revokeApiKey(id: number) {
  // API keys may not be in Supabase - stub
  console.log('revokeApiKey called:', id);
  return true;
}
