import { apiRequest as baseApiRequest } from "@/lib/queryClient";
import { QueryClient } from "@tanstack/react-query";
import { 
  BookingStatus, 
  BusinessType, 
  CalendarSource,
  MarketingContent
} from "@shared/schema";
import {
  BookingAnalyticsSchema,
  DashboardStatsSchema,
  RevenueAnalyticsSchema,
  AdminVendorsSchema,
  type BookingAnalytics,
  type DashboardStats,
  type RevenueAnalytics,
  type AdminVendors,
} from "@shared/types/admin";
import {
  BusinessBookingsResponseSchema,
  BusinessPaymentsResponseSchema,
  BusinessReportsResponseSchema,
  BusinessTestSchema,
  BusinessSyncResponseSchema,
  BusinessVendorsResponseSchema,
  type BusinessBookingsResponse,
  type BusinessPaymentsResponse,
  type BusinessReportsResponse,
  type BusinessTest,
  type BusinessSyncResponse,
  type BusinessVendorsResponse,
} from "@shared/types/business";
import {
  ApiBookingsResponseSchema,
  type ApiBookingsResponse,
} from "@shared/types/bookings";
import {
  CalendarSourceSchema,
  CalendarSourcesSchema,
  DeleteCalendarSourceResponseSchema,
  SyncCalendarResponseSchema,
  type CalendarSource as ApiCalendarSource,
  type CalendarSources as ApiCalendarSources,
  type SyncCalendarResponse,
} from "@shared/types/calendar";
import {
  ServiceListSchema,
  ServicePricingListSchema,
  type ServiceList,
  type ServicePricingList,
} from "@shared/types/services";
import {
  NotificationsSchema,
  SimpleSystemLogsSchema,
  type Notifications,
  type SimpleSystemLogs,
} from "@shared/types/notifications";
import { UserProfileSchema, type UserProfile } from "@shared/types/user";

// Re-export the shared request helper so pages can import it from "@/lib/api".
export const apiRequest = baseApiRequest;

async function fetchJson<T>(url: string, schema: { parse: (input: unknown) => T }): Promise<T> {
  const res = await apiRequest("GET", url);
  const json: unknown = await res.json();
  return schema.parse(json);
}

// Calendar API functions
export async function fetchCalendarSources(): Promise<ApiCalendarSources> {
  return fetchJson("/api/calendar-sources", CalendarSourcesSchema);
}

export async function fetchServicesList(): Promise<ServiceList> {
  return fetchJson("/api/services", ServiceListSchema);
}

export async function fetchServicePricing(): Promise<ServicePricingList> {
  return fetchJson("/api/services", ServicePricingListSchema);
}

export async function syncCalendar(sourceId: number): Promise<SyncCalendarResponse> {
  try {
    const response = await apiRequest("POST", `/api/calendar-sources/${sourceId}/sync`);
    const json: unknown = await response.json();
    return SyncCalendarResponseSchema.parse(json);
  } catch (error) {
    throw new Error("Failed to sync calendar");
  }
}

export async function addCalendarSource(data: {
  name: string;
  url: string;
  type: string;
  serviceId?: number;
}): Promise<ApiCalendarSource> {
  try {
    const response = await apiRequest("POST", "/api/calendar-sources", data);
    const json: unknown = await response.json();
    return CalendarSourceSchema.parse(json);
  } catch (error) {
    throw new Error("Failed to add calendar source");
  }
}

export async function deleteCalendarSource(sourceId: number): Promise<void> {
  try {
    const res = await apiRequest("DELETE", `/api/calendar-sources/${sourceId}`);
    const json: unknown = await res.json();
    DeleteCalendarSourceResponseSchema.parse(json);
  } catch (error) {
    throw new Error("Failed to delete calendar source");
  }
}

// Booking API functions
export async function updateBookingStatus(
  bookingId: number, 
  status: BookingStatus,
  queryClient: QueryClient
): Promise<void> {
  try {
    await apiRequest("PUT", `/api/bookings/${bookingId}`, { status });
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    queryClient.invalidateQueries({ queryKey: ['/api/bookings/recent'] });
  } catch (error) {
    throw new Error("Failed to update booking status");
  }
}

// Service API functions
export async function updateServicePrice(
  serviceId: number, 
  basePrice: number,
  queryClient: QueryClient
): Promise<void> {
  try {
    await apiRequest("PUT", `/api/services/${serviceId}`, { basePrice });
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['/api/services'] });
  } catch (error) {
    throw new Error("Failed to update service price");
  }
}

// Marketing API functions
export async function generateMarketingContent(data: {
  contentType: string;
  serviceId?: number;
  serviceDescription: string;
  targetAudience: string;
  tone: string;
}): Promise<{ success: boolean; content: string; marketingContent: MarketingContent }> {
  try {
    const response = await apiRequest("POST", "/api/ai/generate-marketing", data);
    return await response.json();
  } catch (error) {
    throw new Error("Failed to generate marketing content");
  }
}

// Notification API functions
export async function markAllNotificationsAsRead(queryClient: QueryClient): Promise<void> {
  try {
    await apiRequest("POST", "/api/notifications/mark-all-read");
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
  } catch (error) {
    throw new Error("Failed to mark notifications as read");
  }
}

export async function markNotificationAsRead(notificationId: number, queryClient: QueryClient): Promise<void> {
  try {
    await apiRequest("POST", `/api/notifications/${notificationId}/mark-read`);
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
  } catch (error) {
    throw new Error("Failed to mark notification as read");
  }
}

// User API functions
export async function updateUserProfile(
  data: {
    fullName?: string;
    businessName?: string;
    businessType?: BusinessType;
    email?: string;
  },
  queryClient: QueryClient
): Promise<void> {
  try {
    await apiRequest("PUT", "/api/users/profile", data);
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  } catch (error) {
    throw new Error("Failed to update profile");
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    await apiRequest("PUT", "/api/users/password", {
      currentPassword,
      newPassword
    });
  } catch (error) {
    throw new Error("Failed to change password");
  }
}

// ---- Typed admin/dashboard API functions ----

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return fetchJson("/api/dashboard/stats", DashboardStatsSchema);
}

export async function fetchBookingAnalytics(): Promise<BookingAnalytics> {
  return fetchJson("/api/dashboard/booking-analytics", BookingAnalyticsSchema);
}

export async function fetchRevenueAnalytics(): Promise<RevenueAnalytics> {
  return fetchJson("/api/revenue/analytics", RevenueAnalyticsSchema);
}

export async function fetchAdminVendors(): Promise<AdminVendors> {
  return fetchJson("/api/vendors", AdminVendorsSchema);
}

// ---- Typed business data ----

export async function fetchBusinessTest(): Promise<BusinessTest> {
  return fetchJson("/api/business/test", BusinessTestSchema);
}

export async function fetchBusinessVendors(): Promise<BusinessVendorsResponse> {
  return fetchJson("/api/business/vendors", BusinessVendorsResponseSchema);
}

export async function fetchBusinessBookings(): Promise<BusinessBookingsResponse> {
  return fetchJson("/api/business/bookings", BusinessBookingsResponseSchema);
}

export async function fetchBusinessPayments(): Promise<BusinessPaymentsResponse> {
  return fetchJson("/api/business/payments", BusinessPaymentsResponseSchema);
}

export async function fetchBusinessReports(): Promise<BusinessReportsResponse> {
  return fetchJson("/api/business/reports", BusinessReportsResponseSchema);
}

export async function syncBusinessData(syncType: string): Promise<BusinessSyncResponse> {
  const res = await apiRequest("POST", "/api/business/sync", { syncType });
  const json: unknown = await res.json();
  return BusinessSyncResponseSchema.parse(json);
}

// ---- Typed bookings ----

export async function fetchBookings(): Promise<ApiBookingsResponse> {
  return fetchJson("/api/bookings", ApiBookingsResponseSchema);
}

export async function fetchRecentBookings(limit?: number): Promise<ApiBookingsResponse> {
  const qs = typeof limit === "number" ? `?limit=${encodeURIComponent(String(limit))}` : "";
  return fetchJson(`/api/bookings/recent${qs}`, ApiBookingsResponseSchema);
}

// ---- Notifications + simple system logs ----

export async function fetchNotifications(): Promise<Notifications> {
  return fetchJson("/api/notifications", NotificationsSchema);
}

export async function fetchSimpleSystemLogs(): Promise<SimpleSystemLogs> {
  return fetchJson("/api/system-logs", SimpleSystemLogsSchema);
}

export async function fetchAuthMe(): Promise<UserProfile> {
  return fetchJson("/api/auth/me", UserProfileSchema);
}
