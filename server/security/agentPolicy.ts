// server/security/agentPolicy.ts

/**
 * RBAC Policy Engine for AI Agent Actions
 */

export type PolicyResult = {
  allowed: boolean;
  reason?: string;
  requiresOwnerApproval?: boolean;
};

// Define permissions for each agent role
export const AGENT_PERMISSIONS: Record<string, string[]> = {
  OWNER: ["*"], // All permissions

  LEADER: [
    "tasks:create",
    "tasks:read",
    "vendors:read",
    "vendors:approve",
    "vendors:suspend",
    "bookings:read",
    "services:read",
    "audit:read",
  ],

  VENDOR_ONBOARDING: [
    "vendors:create",
    "vendors:read",
    "vendors:update",
    "notifications:create",
  ],

  BOOKING_MANAGER: [
    "bookings:create",
    "bookings:read",
    "bookings:update",
    "bookings:confirm",
    "bookings:cancel",
    "calendar:read",
    "services:read",
    "notifications:create",
  ],

  CALENDAR_SYNC: [
    "calendar:create",
    "calendar:read",
    "calendar:sync",
    "calendar:update",
    "services:read",
  ],

  PRICING: [
    "services:read",
    "services:update-price",
    "pricing-rules:create",
    "pricing-rules:read",
    "pricing-rules:update",
  ],

  MARKETING: [
    "campaigns:create",
    "campaigns:read",
    "campaigns:update",
    "campaigns:launch",
    "content:generate",
    "services:read",
  ],

  SUPPORT: [
    "tickets:create",
    "tickets:read",
    "tickets:update",
    "notifications:create",
  ],

  FINANCE: [
    "checkout:create",
    "payments:read",
    "refunds:create",
    "bookings:read",
  ],
};

// High-risk actions that require OWNER approval (if env var enabled)
const HIGH_RISK_ACTIONS = [
  "refunds:create",
  "vendors:suspend",
  "bookings:cancel-after-payment",
];

/**
 * Check if an agent role has permission to perform an action
 */
export function checkPermission(
  agentRole: string,
  action: string,
  targetData?: Record<string, any>
): PolicyResult {
  // OWNER has all permissions
  if (agentRole === "OWNER") {
    return { allowed: true };
  }

  const permissions = AGENT_PERMISSIONS[agentRole] || [];

  // Check for wildcard permission
  if (permissions.includes("*")) {
    return { allowed: true };
  }

  // Check exact match
  if (permissions.includes(action)) {
    // Check if action requires OWNER approval
    if (HIGH_RISK_ACTIONS.includes(action)) {
      // If REQUIRE_OWNER_APPROVAL env var is set, flag for approval
      if (process.env.REQUIRE_OWNER_APPROVAL === "true") {
        return {
          allowed: false,
          requiresOwnerApproval: true,
          reason: `Action ${action} requires OWNER approval (REQUIRE_OWNER_APPROVAL=true)`,
        };
      }
    }

    return { allowed: true };
  }

  // Check wildcard prefix (e.g., "bookings:*" matches "bookings:create")
  const actionPrefix = action.split(":")[0];
  if (permissions.includes(`${actionPrefix}:*`)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Role ${agentRole} does not have permission: ${action}`,
  };
}

/**
 * Check if booking cancellation is post-payment (high-risk)
 */
export function isPostPaymentCancellation(bookingData: {
  status: string;
  paymentStatus?: string;
}): boolean {
  return (
    bookingData.status === "confirmed" &&
    (bookingData.paymentStatus === "paid" || bookingData.paymentStatus === "succeeded")
  );
}

/**
 * Validate vendor suspension request
 */
export function validateVendorSuspension(vendorData: {
  hasActiveBookings?: boolean;
  outstandingBalance?: number;
}): PolicyResult {
  // Business rule: Warn if vendor has active bookings
  if (vendorData.hasActiveBookings) {
    return {
      allowed: true,
      reason: "Warning: Vendor has active bookings. Ensure proper customer notification.",
    };
  }

  return { allowed: true };
}

/**
 * Validate refund request
 */
export function validateRefund(refundData: {
  bookingStatus: string;
  paymentStatus?: string;
  amount?: number;
  originalAmount?: number;
}): PolicyResult {
  // Can only refund confirmed or completed bookings
  if (!["confirmed", "completed", "cancelled"].includes(refundData.bookingStatus)) {
    return {
      allowed: false,
      reason: `Cannot refund booking with status: ${refundData.bookingStatus}`,
    };
  }

  // Validate refund amount doesn't exceed original
  if (
    refundData.amount &&
    refundData.originalAmount &&
    refundData.amount > refundData.originalAmount
  ) {
    return {
      allowed: false,
      reason: `Refund amount (${refundData.amount}) exceeds original payment (${refundData.originalAmount})`,
    };
  }

  return { allowed: true };
}

/**
 * Validate booking creation (check for double-booking)
 */
export function validateBookingCreation(bookingData: {
  startDate: Date | string;
  endDate: Date | string;
  serviceAvailable?: boolean;
  conflictingBookings?: number;
}): PolicyResult {
  // Service must be available
  if (bookingData.serviceAvailable === false) {
    return {
      allowed: false,
      reason: "Service is not available for booking",
    };
  }

  // Check for conflicts
  if (bookingData.conflictingBookings && bookingData.conflictingBookings > 0) {
    return {
      allowed: false,
      reason: `Conflicting bookings exist (${bookingData.conflictingBookings} found)`,
    };
  }

  // Validate date range
  const start = new Date(bookingData.startDate);
  const end = new Date(bookingData.endDate);
  if (start >= end) {
    return {
      allowed: false,
      reason: "End date must be after start date",
    };
  }

  return { allowed: true };
}



