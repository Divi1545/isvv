import { z } from "zod";
import { businessTypes } from "@shared/schema";

/**
 * Minimal user profile shape used by profile-settings page.
 */
export const UserProfileSchema = z.object({
  id: z.number().optional(),
  fullName: z.string().optional(),
  email: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.enum(businessTypes).optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;


