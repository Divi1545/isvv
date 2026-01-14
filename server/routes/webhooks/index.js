const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { logger } = require('../../middleware/logging');
const { storage } = require('../../storage-provider');

// n8n webhook endpoint
router.post('/n8n', async (req, res) => {
  try {
    // Verify webhook signature if configured
    if (process.env.N8N_WEBHOOK_SECRET) {
      const signature = req.headers['x-n8n-signature'];
      const expectedSignature = crypto
        .createHmac('sha256', process.env.N8N_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid signature' 
        });
      }
    }

    const { workflow, data, executionId } = req.body;
    
    logger.info('n8n webhook received', { workflow, executionId });

    let result;
    switch (workflow) {
      case 'booking_automation':
        result = await handleBookingAutomation(data);
        break;
      case 'vendor_onboarding':
        result = await handleVendorOnboarding(data);
        break;
      case 'support_escalation':
        result = await handleSupportEscalation(data);
        break;
      default:
        result = { message: 'Workflow not recognized' };
    }

    res.json({
      success: true,
      executionId,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('n8n webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      fallback: 'Manual processing required'
    });
  }
});

// Telegram webhook for bot commands
router.post('/telegram', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.text) {
      return res.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text;

    // Handle bot commands
    if (text.startsWith('/')) {
      const [command, ...args] = text.split(' ');
      
      switch (command) {
        case '/status':
          await handleStatusCommand(chatId);
          break;
        case '/bookings':
          await handleBookingsCommand(chatId, args);
          break;
        case '/vendor':
          await handleVendorCommand(chatId, args);
          break;
        case '/help':
          await handleHelpCommand(chatId);
          break;
        default:
          await sendTelegramMessage(chatId, 'Unknown command. Type /help for available commands.');
      }
    }

    res.json({ ok: true });

  } catch (error) {
    logger.error('Telegram webhook error:', error);
    res.json({ ok: true });
  }
});

// Stripe webhook
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    // Stripe webhook verification would go here
    const event = req.body;
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        logger.info(`Unhandled Stripe event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Helper functions
async function handleBookingAutomation(data) {
  const booking = await storage.createBooking({
    userId: data.vendorId,
    serviceId: data.serviceId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    totalPrice: data.totalPrice,
    commission: data.commission || data.totalPrice * 0.1,
    status: 'pending'
  });

  await storage.createNotification({
    userId: 1,
    title: 'Automated Booking Created',
    message: `Booking ${booking.id} created via n8n automation`,
    type: 'system'
  });

  return { bookingId: booking.id };
}

async function handleVendorOnboarding(data) {
  const vendor = await storage.createUser({
    username: data.email,
    email: data.email,
    password: 'temp-password',
    fullName: data.fullName,
    businessName: data.businessName,
    businessType: data.businessType,
    role: 'vendor'
  });

  return { vendorId: vendor.id };
}

async function handleSupportEscalation(data) {
  await storage.createNotification({
    userId: 1,
    title: 'Support Escalation',
    message: `Issue: ${data.issue}\nCustomer: ${data.customerEmail}`,
    type: 'urgent'
  });

  return { escalated: true };
}

async function handleStatusCommand(chatId) {
  try {
    const bookings = await storage.getBookings(1);
    const todayBookings = bookings.filter(b => {
      const today = new Date().toDateString();
      return new Date(b.createdAt).toDateString() === today;
    });

    const message = `
📊 Today's Status

📅 Bookings: ${todayBookings.length}
💰 Revenue: $${todayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)}
🤖 System: Operational

View Dashboard: ${process.env.APP_URL || 'https://localhost:5000'}/admin
    `;

    await sendTelegramMessage(chatId, message);
  } catch (error) {
    await sendTelegramMessage(chatId, 'Error fetching status. Please check the dashboard.');
  }
}

async function handleHelpCommand(chatId) {
  const message = `
🤖 IslandLoaf Bot Commands

/status - System status and today's metrics
/bookings [date] - View bookings
/vendor [id] - Vendor information
/help - Show this message

For urgent support, contact admin.
  `;

  await sendTelegramMessage(chatId, message);
}

async function sendTelegramMessage(chatId, message) {
  // Telegram message sending would be implemented here
  logger.info('Telegram message sent', { chatId, message });
}

async function handlePaymentSuccess(paymentIntent) {
  logger.info('Payment succeeded', { paymentIntentId: paymentIntent.id });
}

async function handlePaymentFailure(paymentIntent) {
  logger.error('Payment failed', { paymentIntentId: paymentIntent.id });
}

module.exports = router;