import { z } from "zod";

const IsoDateString = z.union([z.string(), z.date()]).transform((v) =>
  v instanceof Date ? v.toISOString() : v,
);

export const CalendarSourceSchema = z.object({
  id: z.number(),
  userId: z.number().optional(),
  serviceId: z.number().nullable().optional(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  lastSynced: z.union([IsoDateString, z.null()]).optional(),
  createdAt: z.union([IsoDateString, z.null()]).optional(),
});
export type CalendarSource = z.infer<typeof CalendarSourceSchema>;

export const CalendarSourcesSchema = z.array(CalendarSourceSchema);
export type CalendarSources = z.infer<typeof CalendarSourcesSchema>;

export const SyncCalendarResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type SyncCalendarResponse = z.infer<typeof SyncCalendarResponseSchema>;

export const DeleteCalendarSourceResponseSchema = z.object({
  message: z.string().optional(),
});
export type DeleteCalendarSourceResponse = z.infer<typeof DeleteCalendarSourceResponseSchema>;


