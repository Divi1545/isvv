// server/agents/executors/vendorOnboardingAgent.ts
import * as storage from "../../storage-adapter";
import { hashAgentKey } from "../../security/agentAuth";
import bcrypt from "bcryptjs";

export interface VendorOnboardingResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute vendor onboarding task
 */
export async function executeTask(taskInput: Record<string, any>): Promise<VendorOnboardingResult> {
  const action = taskInput.action;

  try {
    switch (action) {
      case "create_vendor":
        return await createVendor(taskInput);

      case "approve_vendor":
        return await approveVendor(taskInput);

      case "send_welcome":
        return await sendWelcomeNotification(taskInput);

      default:
        return {
          success: false,
          error: `Unknown vendor onboarding action: ${action}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Vendor onboarding task failed",
    };
  }
}

async function createVendor(data: Record<string, any>): Promise<VendorOnboardingResult> {
  const { email, fullName, businessName, businessType, password } = data;

  if (!email || !fullName || !businessName || !businessType) {
    return {
      success: false,
      error: "Missing required fields: email, fullName, businessName, businessType",
    };
  }

  // Generate password if not provided
  const generatedPassword = password || `temp-${Math.random().toString(36).slice(2, 10)}`;
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);

  const vendor = await storage.createUser({
    email,
    username: email,
    password: hashedPassword,
    fullName,
    businessName,
    businessType,
    role: "vendor",
    categoriesAllowed: data.categoriesAllowed,
  });

  return {
    success: true,
    data: {
      vendorId: vendor.id,
      email: vendor.email,
      businessName: vendor.businessName,
      temporaryPassword: !password ? generatedPassword : undefined,
    },
  };
}

async function approveVendor(data: Record<string, any>): Promise<VendorOnboardingResult> {
  const { vendorId } = data;

  if (!vendorId) {
    return {
      success: false,
      error: "Missing vendorId",
    };
  }

  const vendor = await storage.getUser(vendorId);
  if (!vendor) {
    return {
      success: false,
      error: "Vendor not found",
    };
  }

  // Note: Current schema doesn't have isActive field
  // This is a placeholder for future implementation
  return {
    success: true,
    data: {
      vendorId,
      status: "approved",
      approvedAt: new Date().toISOString(),
    },
  };
}

async function sendWelcomeNotification(data: Record<string, any>): Promise<VendorOnboardingResult> {
  const { vendorId, message } = data;

  if (!vendorId) {
    return {
      success: false,
      error: "Missing vendorId",
    };
  }

  await storage.createNotification({
    userId: vendorId,
    title: "Welcome to IslandLoaf!",
    message: message || "Your vendor account has been created successfully. Start adding your services!",
    type: "info",
  });

  return {
    success: true,
    data: {
      vendorId,
      notificationSent: true,
    },
  };
}



