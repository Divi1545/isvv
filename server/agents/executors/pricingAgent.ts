// server/agents/executors/pricingAgent.ts
import * as storage from "../../storage-adapter";

export interface PricingAgentResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute pricing management task
 */
export async function executeTask(taskInput: Record<string, any>): Promise<PricingAgentResult> {
  const action = taskInput.action;

  try {
    switch (action) {
      case "update_price":
        return await updateBasePrice(taskInput);

      case "validate_price":
        return await validatePrice(taskInput);

      case "log_change":
        return await logPriceChange(taskInput);

      default:
        return {
          success: false,
          error: `Unknown pricing action: ${action}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Pricing task failed",
    };
  }
}

async function updateBasePrice(data: Record<string, any>): Promise<PricingAgentResult> {
  const { serviceId, basePrice } = data;

  if (!serviceId || !basePrice) {
    return {
      success: false,
      error: "Missing serviceId or basePrice",
    };
  }

  if (basePrice <= 0) {
    return {
      success: false,
      error: "Base price must be positive",
    };
  }

  const service = await storage.updateService(serviceId, { basePrice });
  if (!service) {
    return {
      success: false,
      error: "Service not found",
    };
  }

  // Log price change
  await storage.createNotification({
    userId: service.userId,
    title: "Price Updated",
    message: `Service "${service.name}" price updated to ${basePrice}`,
    type: "info",
  });

  return {
    success: true,
    data: {
      serviceId,
      basePrice: service.basePrice,
      serviceName: service.name,
    },
  };
}

async function validatePrice(data: Record<string, any>): Promise<PricingAgentResult> {
  const { basePrice, minPrice, maxPrice } = data;

  if (basePrice === undefined) {
    return {
      success: false,
      error: "Missing basePrice",
    };
  }

  const errors: string[] = [];

  if (basePrice <= 0) {
    errors.push("Price must be positive");
  }

  if (minPrice !== undefined && basePrice < minPrice) {
    errors.push(`Price ${basePrice} is below minimum ${minPrice}`);
  }

  if (maxPrice !== undefined && basePrice > maxPrice) {
    errors.push(`Price ${basePrice} exceeds maximum ${maxPrice}`);
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: errors.join(", "),
    };
  }

  return {
    success: true,
    data: {
      basePrice,
      valid: true,
    },
  };
}

async function logPriceChange(data: Record<string, any>): Promise<PricingAgentResult> {
  const { serviceId, oldPrice, newPrice, reason } = data;

  if (!serviceId || oldPrice === undefined || newPrice === undefined) {
    return {
      success: false,
      error: "Missing serviceId, oldPrice, or newPrice",
    };
  }

  // Log as system notification
  await storage.createNotification({
    userId: 1, // Admin
    title: "Price Change Log",
    message: `Service ${serviceId}: ${oldPrice} → ${newPrice}. Reason: ${reason || "N/A"}`,
    type: "info",
  });

  return {
    success: true,
    data: {
      serviceId,
      oldPrice,
      newPrice,
      loggedAt: new Date().toISOString(),
    },
  };
}



