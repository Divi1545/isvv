// server/agents/executors/bookingManagerAgent.ts
import * as storage from "../../storage-adapter";

export interface BookingManagerResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute booking management task
 */
export async function executeTask(taskInput: Record<string, any>): Promise<BookingManagerResult> {
  const action = taskInput.action;

  try {
    switch (action) {
      case "create_booking":
        return await createBooking(taskInput);

      case "confirm_booking":
        return await confirmBooking(taskInput);

      case "cancel_booking":
        return await cancelBooking(taskInput);

      case "check_availability":
        return await checkAvailability(taskInput);

      default:
        return {
          success: false,
          error: `Unknown booking action: ${action}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Booking task failed",
    };
  }
}

async function createBooking(data: Record<string, any>): Promise<BookingManagerResult> {
  const {
    userId,
    serviceId,
    customerName,
    customerEmail,
    startDate,
    endDate,
    totalPrice,
    commission,
  } = data;

  if (!userId || !serviceId || !customerName || !customerEmail || !startDate || !endDate || !totalPrice) {
    return {
      success: false,
      error: "Missing required booking fields",
    };
  }

  const booking = await storage.createBooking({
    userId,
    serviceId,
    customerName,
    customerEmail,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    totalPrice,
    commission: commission || totalPrice * 0.1,
    status: "pending",
    notes: data.notes,
  });

  // Send confirmation notification
  await storage.createNotification({
    userId,
    title: "New Booking Created",
    message: `Booking for ${customerName} (${customerEmail}) from ${startDate} to ${endDate}`,
    type: "info",
  });

  return {
    success: true,
    data: {
      bookingId: booking.id,
      status: "pending",
      customerName,
      customerEmail,
    },
  };
}

async function confirmBooking(data: Record<string, any>): Promise<BookingManagerResult> {
  const { bookingId } = data;

  if (!bookingId) {
    return {
      success: false,
      error: "Missing bookingId",
    };
  }

  const booking = await storage.updateBooking(bookingId, { status: "confirmed" });
  if (!booking) {
    return {
      success: false,
      error: "Booking not found",
    };
  }

  await storage.createNotification({
    userId: booking.userId,
    title: "Booking Confirmed",
    message: `Booking #${bookingId} has been confirmed`,
    type: "success",
  });

  return {
    success: true,
    data: {
      bookingId,
      status: "confirmed",
    },
  };
}

async function cancelBooking(data: Record<string, any>): Promise<BookingManagerResult> {
  const { bookingId, reason } = data;

  if (!bookingId) {
    return {
      success: false,
      error: "Missing bookingId",
    };
  }

  const booking = await storage.updateBooking(bookingId, { status: "cancelled" });
  if (!booking) {
    return {
      success: false,
      error: "Booking not found",
    };
  }

  await storage.createNotification({
    userId: booking.userId,
    title: "Booking Cancelled",
    message: `Booking #${bookingId} has been cancelled. Reason: ${reason || "No reason provided"}`,
    type: "warning",
  });

  return {
    success: true,
    data: {
      bookingId,
      status: "cancelled",
      reason,
    },
  };
}

async function checkAvailability(data: Record<string, any>): Promise<BookingManagerResult> {
  const { serviceId, startDate, endDate } = data;

  if (!serviceId || !startDate || !endDate) {
    return {
      success: false,
      error: "Missing serviceId, startDate, or endDate",
    };
  }

  // TODO: Implement actual availability check against calendar events
  // For now, return mock availability
  return {
    success: true,
    data: {
      serviceId,
      startDate,
      endDate,
      available: true,
      conflictingBookings: 0,
    },
  };
}



