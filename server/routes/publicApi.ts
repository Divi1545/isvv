import { Router, Request, Response } from "express";
import * as storage from "../supabase-storage";
import OpenAI from "openai";
import Stripe from "stripe";

const router = Router();

const PLATFORM_COMMISSION_RATE = 0.125;

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;

router.get("/services", async (req: Request, res: Response) => {
  try {
    const { type, location, minPrice, maxPrice, limit = "50", offset = "0" } = req.query;
    
    let services = await storage.getServices();
    
    if (type && typeof type === "string") {
      services = services.filter((s: any) => s.type === type);
    }
    if (location && typeof location === "string") {
      services = services.filter((s: any) => 
        s.location?.toLowerCase().includes(location.toLowerCase())
      );
    }
    if (minPrice) {
      services = services.filter((s: any) => s.basePrice >= parseFloat(minPrice as string));
    }
    if (maxPrice) {
      services = services.filter((s: any) => s.basePrice <= parseFloat(maxPrice as string));
    }
    
    services = services.filter((s: any) => s.available !== false);
    
    const total = services.length;
    const paginatedServices = services.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );
    
    const publicServices = paginatedServices.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      type: s.type,
      basePrice: s.basePrice,
      currency: s.currency || "USD",
      location: s.location,
      images: s.images || [],
      imageUrl: s.imageUrl,
      rating: s.rating,
      reviewsCount: s.reviewsCount,
      amenities: s.amenities || [],
      maxCapacity: s.maxCapacity,
    }));

    res.json({
      success: true,
      data: publicServices,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + paginatedServices.length < total,
      },
    });
  } catch (error: any) {
    console.error("Public API - Get services error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch services" });
  }
});

router.get("/services/:id", async (req: Request, res: Response) => {
  try {
    const serviceId = parseInt(req.params.id);
    if (isNaN(serviceId)) {
      return res.status(400).json({ success: false, error: "Invalid service ID" });
    }

    const service = await storage.getService(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, error: "Service not found" });
    }

    const publicService = {
      id: service.id,
      name: service.name,
      description: service.description,
      type: service.type,
      basePrice: service.basePrice,
      currency: service.currency || "USD",
      location: service.location,
      images: service.images || [],
      imageUrl: service.imageUrl,
      rating: service.rating,
      reviewsCount: service.reviewsCount,
      amenities: service.amenities || [],
      maxCapacity: service.maxCapacity,
      available: service.available,
    };

    res.json({ success: true, data: publicService });
  } catch (error: any) {
    console.error("Public API - Get service error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch service" });
  }
});

router.post("/bookings", async (req: Request, res: Response) => {
  try {
    const {
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      startDate,
      endDate,
      guests,
      specialRequests,
    } = req.body;

    if (!serviceId || !customerName || !customerEmail || !startDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: serviceId, customerName, customerEmail, startDate",
      });
    }

    const service = await storage.getService(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, error: "Service not found" });
    }

    const guestCount = Math.max(1, parseInt(guests) || 1);
    const calculatedTotal = service.basePrice * guestCount;
    const platformCommission = calculatedTotal * PLATFORM_COMMISSION_RATE;
    const vendorPayout = calculatedTotal - platformCommission;

    const booking = await storage.createBooking({
      userId: service.userId,
      serviceId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      guestsCount: guests || 1,
      totalPrice: calculatedTotal,
      specialRequests: specialRequests || undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        bookingId: booking.id,
        status: booking.status,
        totalAmount: calculatedTotal,
        platformCommission,
        vendorPayout,
        currency: service.currency || "USD",
      },
    });
  } catch (error: any) {
    console.error("Public API - Create booking error:", error);
    res.status(500).json({ success: false, error: "Failed to create booking" });
  }
});

router.get("/bookings/:id", async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id);
    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, error: "Invalid booking ID" });
    }

    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    const publicBooking = {
      id: booking.id,
      bookingReference: booking.booking_reference,
      serviceName: booking.services?.name || "Service",
      status: booking.status,
      paymentStatus: booking.payment_status,
      startDate: booking.start_date,
      endDate: booking.end_date,
      guests: booking.guests_count,
      totalPrice: booking.total_price,
      createdAt: booking.created_at,
    };

    res.json({ success: true, data: publicBooking });
  } catch (error: any) {
    console.error("Public API - Get booking error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch booking" });
  }
});

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    if (!openai) {
      return res.status(503).json({
        success: false,
        error: "AI chat is temporarily unavailable",
      });
    }

    const services = await storage.getServices();
    const availableServices = services.filter((s: any) => s.available !== false);
    
    const servicesContext = availableServices.slice(0, 20).map((s: any) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      description: s.description?.substring(0, 200),
      price: s.basePrice,
      location: s.location,
    }));

    const systemPrompt = `You are a helpful tourism assistant for IslandLoaf, a Sri Lankan tourism platform. 
You help customers find and book tourism services including:
- Stays (hotels, villas, guesthouses)
- Tours (cultural, adventure, wildlife)
- Vehicles (car rentals, drivers)
- Wellness (spas, yoga, ayurveda)
- Tickets (attractions, events)

Available services:
${JSON.stringify(servicesContext, null, 2)}

Guidelines:
- Be friendly and helpful
- Recommend services based on customer needs
- Provide pricing information when relevant
- Help customers understand what's included
- If asked about bookings, explain they can book directly on the website
- Keep responses concise but informative`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "I apologize, I couldn't process your request.";

    const mentionedServices = availableServices.filter((s: any) =>
      assistantMessage.toLowerCase().includes(s.name.toLowerCase())
    );

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        suggestedServices: mentionedServices.slice(0, 3).map((s: any) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          price: s.basePrice,
          imageUrl: s.imageUrl,
        })),
      },
    });
  } catch (error: any) {
    console.error("Public API - Chat error:", error);
    res.status(500).json({ success: false, error: "Failed to process chat message" });
  }
});

router.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { bookingId, successUrl, cancelUrl } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: "Booking ID is required" });
    }

    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: "Payment processing is temporarily unavailable",
      });
    }

    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    if (booking.payment_status === "paid") {
      return res.status(400).json({ success: false, error: "Booking already paid" });
    }

    const totalPrice = booking.total_price || 0;
    const serviceName = booking.services?.name || "Service";
    const platformCommission = totalPrice * PLATFORM_COMMISSION_RATE;
    const vendorPayout = totalPrice - platformCommission;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: serviceName,
              description: `Booking #${booking.id} - ${booking.start_date}`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `${req.headers.origin}/booking/success?id=${booking.id}`,
      cancel_url: cancelUrl || `${req.headers.origin}/booking/cancel?id=${booking.id}`,
      metadata: {
        bookingId: booking.id.toString(),
        platformCommission: platformCommission.toFixed(2),
        vendorPayout: vendorPayout.toFixed(2),
      },
    });

    res.json({
      success: true,
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
        breakdown: {
          total: totalPrice,
          platformCommission,
          vendorPayout,
          commissionRate: `${PLATFORM_COMMISSION_RATE * 100}%`,
        },
      },
    });
  } catch (error: any) {
    console.error("Public API - Checkout error:", error);
    res.status(500).json({ success: false, error: "Failed to create checkout session" });
  }
});

router.post("/webhook/stripe", async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: "Stripe not configured" });
    }

    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured - rejecting webhook");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    if (!sig) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = parseInt(session.metadata?.bookingId);

      if (bookingId) {
        await storage.updateBooking(bookingId, {
          paymentStatus: "paid",
          status: "confirmed",
        });
        console.log(`Booking ${bookingId} marked as paid`);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: true,
      openai: !!openai,
      stripe: !!stripe,
    },
  });
});

export default router;
