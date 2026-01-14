import { z } from "zod";

/**
 * Admin / dashboard API response schemas.
 *
 * These validate the JSON we receive from the backend and give us inferred
 * TypeScript types without any casting.
 */

export const DashboardMonthlyRevenuePointSchema = z.object({
  month: z.string(),
  revenue: z.number(),
});

export const DashboardRecentBookingSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  status: z.string(),
  price: z.number().optional(),
});

export const DashboardVendorStatSchema = z.object({
  name: z.string(),
  role: z.string(),
  businessType: z.string().optional(),
  bookingCount: z.number().optional(),
});

export const DashboardStatsSchema = z.object({
  totalVendors: z.number().optional(),
  activeVendors: z.number().optional(),
  pendingVendors: z.number().optional(),
  inactiveVendors: z.number().optional(),

  totalBookings: z.number().optional(),
  confirmedBookings: z.number().optional(),
  completedBookings: z.number().optional(),

  totalRevenue: z.number().optional(),
  averageBookingValue: z.number().optional(),
  conversionRate: z.number().optional(),
  repeatBookingRate: z.number().optional(),
  monthlyGrowth: z.number().optional(),

  monthlyRevenue: z.array(DashboardMonthlyRevenuePointSchema).optional(),
  recentBookings: z.array(DashboardRecentBookingSchema).optional(),
  vendorStats: z.array(DashboardVendorStatSchema).optional(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const BookingAnalyticsTopVendorSchema = z.object({
  name: z.string(),
  bookings: z.number(),
  revenue: z.number().optional(),
});

export const BookingAnalyticsSchema = z.object({
  businessTypes: z.record(z.string(), z.number()).optional(),
  statusDistribution: z.record(z.string(), z.number()).optional(),
  topVendors: z.array(BookingAnalyticsTopVendorSchema).optional(),
  bookingsByMonth: z
    .array(
      z.object({
        month: z.string(),
        bookings: z.number(),
      }),
    )
    .optional(),
});

export type BookingAnalytics = z.infer<typeof BookingAnalyticsSchema>;

export const RevenueMonthlyTrendSchema = z.object({
  month: z.string(),
  revenue: z.number(),
});

export const RevenueTopVendorSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  businessType: z.string().optional(),
  revenue: z.number(),
  bookingCount: z.number().optional(),
});

export const RevenueAnalyticsSchema = z.object({
  totalRevenue: z.number().optional(),
  totalCommission: z.number().optional(),
  pendingPayouts: z.number().optional(),
  growthRate: z.number().optional(),

  monthlyTrends: z.array(RevenueMonthlyTrendSchema).optional(),
  topVendors: z.array(RevenueTopVendorSchema).optional(),

  revenueByCategory: z.record(
    z.string(),
    z.object({
      revenue: z.number(),
      count: z.number(),
    }),
  ).optional(),

  statusMetrics: z.record(
    z.string(),
    z.object({
      count: z.number(),
      revenue: z.number(),
    }),
  ).optional(),

  totalBookings: z.number().optional(),
});

export type RevenueAnalytics = z.infer<typeof RevenueAnalyticsSchema>;

export const AdminVendorSchema = z.object({
  id: z.number(),
  email: z.string().optional(),
  fullName: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  role: z.string().optional(),
});

export type AdminVendor = z.infer<typeof AdminVendorSchema>;

export const AdminVendorsSchema = z.array(AdminVendorSchema);
export type AdminVendors = z.infer<typeof AdminVendorsSchema>;


