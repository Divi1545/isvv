import { z } from "zod";

const IsoDateString = z.union([z.string(), z.date()]).transform((v) =>
  v instanceof Date ? v.toISOString() : v,
);

export const NotificationSchema = z.object({
  id: z.number(),
  userId: z.number().optional(),
  title: z.string(),
  message: z.string(),
  type: z.string().optional(),
  read: z.boolean().optional().default(false),
  createdAt: IsoDateString,
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationsSchema = z.array(NotificationSchema);
export type Notifications = z.infer<typeof NotificationsSchema>;

export const SimpleSystemLogSchema = z.object({
  id: z.number(),
  action: z.string(),
  details: z.string(),
  user: z.string(),
  timestamp: IsoDateString,
});
export type SimpleSystemLog = z.infer<typeof SimpleSystemLogSchema>;

export const SimpleSystemLogsSchema = z.array(SimpleSystemLogSchema);
export type SimpleSystemLogs = z.infer<typeof SimpleSystemLogsSchema>;




