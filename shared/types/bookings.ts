import { z } from "zod";
import { bookingStatuses } from "@shared/schema";

/**
 * API booking shape for `/api/bookings` and related endpoints.
 *
 * Note: server returns Dates via JSON -> ISO strings. We accept string or Date to
 * be resilient in dev, and normalize to ISO strings for the client.
 */

const IsoDateString = z.union([z.string(), z.date()]).transform((v) =>
  v instanceof Date ? v.toISOString() : v,
);

const NullableIsoDateString = z
  .union([z.string(), z.date(), z.null()])
  .transform((v) => (v instanceof Date ? v.toISOString() : v));

export const ApiBookingStatusSchema = z.enum(bookingStatuses);
export type ApiBookingStatus = z.infer<typeof ApiBookingStatusSchema>;

export const ApiBookingSchema = z.object({
  id: z.number(),
  userId: z.number(),
  serviceId: z.number(),
  customerName: z.string(),
  customerEmail: z.string(),
  startDate: IsoDateString,
  endDate: IsoDateString,
  status: ApiBookingStatusSchema,
  totalPrice: z.number(),
  commission: z.number(),
  notes: z.string().nullable().optional(),
  createdAt: NullableIsoDateString.optional(),
  updatedAt: NullableIsoDateString.optional(),

  // Admin enrichment (see server/routes.ts)
  vendorName: z.string().optional(),
  vendorType: z.string().optional(),

  // Some pages display service name if available (may be absent depending on storage impl)
  serviceName: z.string().optional(),

  // Some dashboard views bucket bookings by service type/category if present.
  serviceType: z.string().optional(),
});

export type ApiBooking = z.infer<typeof ApiBookingSchema>;

export const ApiBookingsResponseSchema = z.array(ApiBookingSchema);
export type ApiBookingsResponse = z.infer<typeof ApiBookingsResponseSchema>;


