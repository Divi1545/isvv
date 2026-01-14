// server/agents/executors/financeAgent.ts
import * as storage from "../../storage-adapter";
import Stripe from "stripe";

// Initialize Stripe if configured
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" })
  : null;

export interface FinanceAgentResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute finance task
 */
export async function executeTask(taskInput: Record<string, any>): Promise<FinanceAgentResult> {
  const action = taskInput.action;

  try {
    switch (action) {
      case "create_checkout":
        return await createCheckout(taskInput);

      case "process_refund":
        return await processRefund(taskInput);

      case "verify_payment":
        return await verifyPayment(taskInput);

      default:
        return {
          success: false,
          error: `Unknown finance action: ${action}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Finance task failed",
    };
  }
}

async function createCheckout(data: Record<string, any>): Promise<FinanceAgentResult> {
  const {
    bookingId,
    amount,
    currency,
    customerEmail,
    successUrl,
    cancelUrl,
  } = data;

  if (!bookingId || !amount || !customerEmail) {
    return {
      success: false,
      error: "Missing required fields: bookingId, amount, customerEmail",
    };
  }

  if (!stripe) {
    return {
      success: true,
      data: {
        sessionId: `mock-session-${Date.now()}`,
        url: `https://checkout.stripe.com/pay/mock-${Date.now()}`,
        status: "mock",
        warning: "Stripe not configured. Returning mock checkout session.",
      },
    };
  }

  // Create real Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: (currency || "USD").toLowerCase(),
          product_data: {
            name: `Booking #${bookingId}`,
            description: `IslandLoaf booking payment`,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl || "https://islandloaf.com/booking/success",
    cancel_url: cancelUrl || "https://islandloaf.com/booking/cancel",
    customer_email: customerEmail,
    metadata: {
      bookingId: bookingId.toString(),
    },
  });

  return {
    success: true,
    data: {
      sessionId: session.id,
      url: session.url,
      status: session.status,
    },
  };
}

async function processRefund(data: Record<string, any>): Promise<FinanceAgentResult> {
  const { bookingId, amount, reason, paymentIntentId } = data;

  if (!bookingId || !amount) {
    return {
      success: false,
      error: "Missing bookingId or amount",
    };
  }

  if (!stripe) {
    // Stripe not configured - return stub
    await storage.createNotification({
      userId: 1, // Admin
      title: "Refund Request (Manual Processing Required)",
      message: `Booking #${bookingId} refund: ${amount}. Reason: ${reason || "N/A"}. Stripe not configured.`,
      type: "warning",
    });

    return {
      success: true,
      data: {
        refundId: `mock-refund-${Date.now()}`,
        status: "mock",
        amount,
        warning: "Stripe not configured. Refund logged for manual processing.",
      },
    };
  }

  // TODO: In production, implement actual Stripe refund
  // const refund = await stripe.refunds.create({
  //   payment_intent: paymentIntentId,
  //   amount: Math.round(amount * 100),
  //   reason: 'requested_by_customer',
  // });

  await storage.createNotification({
    userId: 1, // Admin
    title: "Refund Request (Stub)",
    message: `Booking #${bookingId} refund: ${amount}. Reason: ${reason || "N/A"}. Implement Stripe refund logic.`,
    type: "info",
  });

  return {
    success: true,
    data: {
      refundId: `stub-refund-${Date.now()}`,
      status: "stub",
      amount,
      todo: "Implement stripe.refunds.create() with webhook confirmation",
    },
  };
}

async function verifyPayment(data: Record<string, any>): Promise<FinanceAgentResult> {
  const { sessionId, paymentIntentId } = data;

  if (!sessionId && !paymentIntentId) {
    return {
      success: false,
      error: "Missing sessionId or paymentIntentId",
    };
  }

  if (!stripe) {
    return {
      success: false,
      error: "Stripe not configured. Cannot verify payment.",
    };
  }

  try {
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        success: true,
        data: {
          sessionId,
          status: session.payment_status,
          amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        },
      };
    }

    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        data: {
          paymentIntentId,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
        },
      };
    }

    return {
      success: false,
      error: "Unable to verify payment",
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Payment verification failed: ${error.message}`,
    };
  }
}

