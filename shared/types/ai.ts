import { z } from "zod";

/**
 * AI endpoint response contracts used by `client/src/pages/dashboard/AIFeatures.tsx`.
 * These schemas are intentionally minimal: they include exactly what the UI reads.
 */

// ---- /api/ai/optimize-booking ----
export const BookingOptimizationRecommendationSchema = z.object({
  rank: z.number().optional(),
  matchScore: z.union([z.string(), z.number()]).optional(),
  reasoning: z.string().optional(),
  calculatedPrice: z.union([z.number(), z.string()]).optional(),
  valueRating: z.string().optional(),
});

export const BookingOptimizationResponseSchema = z.object({
  totalOptions: z.number().optional(),
  recommendations: z.array(BookingOptimizationRecommendationSchema).optional(),
  strategy: z.string().optional(),
});
export type BookingOptimizationResponse = z.infer<typeof BookingOptimizationResponseSchema>;

// ---- /api/ai/vendor-analytics ----
export const VendorAnalyticsResponseSchema = z.object({
  calculatedMetrics: z
    .object({
      totalRevenue: z.number().optional(),
      conversionRate: z.number().optional(),
      averageBookingValue: z.number().optional(),
    })
    .optional(),
  businessHealth: z
    .object({
      strengths: z.array(z.string()).optional(),
      opportunities: z.array(z.string()).optional(),
    })
    .optional(),
  actionPlan: z
    .object({
      immediate: z.array(z.string()).optional(),
    })
    .optional(),
});
export type VendorAnalyticsResponse = z.infer<typeof VendorAnalyticsResponseSchema>;

// ---- /api/ai/analyze-feedback ----
export const FeedbackAnalysisResponseSchema = z.object({
  sentiment: z
    .object({
      classification: z.string().optional(),
      confidence: z.string().optional(),
      emotionalTone: z.string().optional(),
    })
    .optional(),
  businessImpact: z
    .object({
      priority: z.string().optional(),
      reputationRisk: z.string().optional(),
      potentialImpact: z.string().optional(),
    })
    .optional(),
  insights: z
    .object({
      keyPoints: z.array(z.string()).optional(),
    })
    .optional(),
  recommendations: z
    .object({
      immediateActions: z.array(z.string()).optional(),
    })
    .optional(),
});
export type FeedbackAnalysisResponse = z.infer<typeof FeedbackAnalysisResponseSchema>;

// ---- /api/ai/trip-concierge ----
export const TripConciergeResponseSchema = z.object({
  summary: z
    .object({
      totalEstimatedCost: z.number().optional(),
      budgetRemaining: z.number().optional(),
    })
    .optional(),
  itinerary: z
    .object({
      days: z
        .array(
          z.object({
            day: z.number().optional(),
            title: z.string().optional(),
            activities: z.array(z.string()).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  recommendations: z
    .object({
      mustDoActivities: z.array(z.string()).optional(),
    })
    .optional(),
});
export type TripConciergeResponse = z.infer<typeof TripConciergeResponseSchema>;

// ---- /api/ai/agent-executor ----
export const AgentExecutorResponseSchema = z.object({
  agent: z.string().optional(),
  action: z.string().optional(),
  executedAt: z.string().optional(),
  result: z
    .object({
      success: z.boolean().optional(),
      message: z.string().optional(),
      content: z.string().optional(),
      analytics: z
        .object({
          totalServices: z.number().optional(),
          totalBookings: z.number().optional(),
          revenue: z.number().optional(),
          activeServices: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});
export type AgentExecutorResponse = z.infer<typeof AgentExecutorResponseSchema>;


