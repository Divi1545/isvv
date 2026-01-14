import { z } from "zod";

/**
 * Minimal service list shape used by calendar-sync and other dashboard pages.
 * UI in some places expects `title`, while server schema typically provides `name`.
 * We allow either; callers can safely display `title` if present.
 */
export const ServiceListItemSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
});
export type ServiceListItem = z.infer<typeof ServiceListItemSchema>;

export const ServiceListSchema = z.array(ServiceListItemSchema);
export type ServiceList = z.infer<typeof ServiceListSchema>;

// Full-ish service shape used by pricing engine.
export const ServicePricingItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  description: z.string(),
  basePrice: z.number(),
});
export type ServicePricingItem = z.infer<typeof ServicePricingItemSchema>;

export const ServicePricingListSchema = z.array(ServicePricingItemSchema);
export type ServicePricingList = z.infer<typeof ServicePricingListSchema>;


