import { z } from "zod";

/**
 * Business reporting endpoints backed by the primary database storage.
 */

export const BusinessTestSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  recordCount: z.number().optional(),
});
export type BusinessTest = z.infer<typeof BusinessTestSchema>;

export const BusinessVendorSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  username: z.string().nullable().optional(),
  email: z.string().email(),
  location: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});
export type BusinessVendor = z.infer<typeof BusinessVendorSchema>;

export const BusinessBookingSchema = z.object({
  id: z.number(),
  userId: z.number(),
  serviceId: z.number(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]),
  status: z.string(),
  totalPrice: z.number(),
  commission: z.number(),
  notes: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});
export type BusinessBooking = z.infer<typeof BusinessBookingSchema>;

export const BusinessPaymentSchema = z.object({
  id: z.string(),
  bookingId: z.number(),
  userId: z.number(),
  amount: z.number(),
  commission: z.number().optional(),
  status: z.string(),
  dueDate: z.union([z.string(), z.date()]),
  createdAt: z.union([z.string(), z.date()]).optional(),
});
export type BusinessPayment = z.infer<typeof BusinessPaymentSchema>;

export const BusinessDailyReportSchema = z.object({
  date: z.string(),
  totalBookings: z.number(),
  totalRevenue: z.number(),
  completedBookings: z.number().optional(),
  cancelledBookings: z.number().optional(),
});
export type BusinessDailyReport = z.infer<typeof BusinessDailyReportSchema>;

export const BusinessCountedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    count: z.number().optional(),
    data: z.array(item).optional(),
  });

export const BusinessVendorsResponseSchema = BusinessCountedResponseSchema(BusinessVendorSchema);
export type BusinessVendorsResponse = z.infer<typeof BusinessVendorsResponseSchema>;

export const BusinessBookingsResponseSchema = BusinessCountedResponseSchema(BusinessBookingSchema);
export type BusinessBookingsResponse = z.infer<typeof BusinessBookingsResponseSchema>;

export const BusinessPaymentsResponseSchema = BusinessCountedResponseSchema(BusinessPaymentSchema);
export type BusinessPaymentsResponse = z.infer<typeof BusinessPaymentsResponseSchema>;

export const BusinessReportsResponseSchema = BusinessCountedResponseSchema(BusinessDailyReportSchema);
export type BusinessReportsResponse = z.infer<typeof BusinessReportsResponseSchema>;

export const BusinessSyncResponseSchema = z.object({
  count: z.number().optional(),
  message: z.string().optional(),
});
export type BusinessSyncResponse = z.infer<typeof BusinessSyncResponseSchema>;


