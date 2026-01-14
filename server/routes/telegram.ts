// server/routes/telegram.ts
import { Router, Request, Response } from "express";
import { handleLeadIntake, type LeadInput } from "../agents/leader";
import { sendMessage } from "../services/telegramClient";

const router = Router();

/**
 * POST /api/telegram/webhook
 * Telegram bot webhook endpoint
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    // Verify webhook secret if configured
    if (process.env.TELEGRAM_WEBHOOK_SECRET) {
      const secretToken = req.headers["x-telegram-bot-api-secret-token"];

      if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        console.warn("Telegram webhook: Invalid secret token");
        return res.status(401).json({
          success: false,
          error: "Invalid secret token",
        });
      }
    }

    const { message, edited_message } = req.body;
    const actualMessage = edited_message || message;

    if (!actualMessage || !actualMessage.text) {
      // No text message, return 200 (Telegram requires this)
      return res.json({ ok: true });
    }

    const chatId = actualMessage.chat.id;
    const text = actualMessage.text;
    const from = actualMessage.from;

    console.log(`Telegram message from ${from.username || from.first_name}: ${text}`);

    // Handle bot commands
    if (text.startsWith("/")) {
      await handleCommand(chatId, text);
      return res.json({ ok: true });
    }

    // Parse message into lead
    const lead: LeadInput = {
      type: detectLeadType(text),
      data: extractLeadData(text, from),
      source: "telegram",
      metadata: {
        chatId,
        username: from.username,
        firstName: from.first_name,
        messageId: actualMessage.message_id,
      },
    };

    // Process lead via Leader agent
    const result = await handleLeadIntake(lead);

    // Send response to user
    let responseMessage = "";
    if (result.success) {
      responseMessage = `✅ ${result.message}\n\nCreated ${result.taskIds.length} task(s).\nTask IDs: ${result.taskIds.join(", ")}`;
    } else {
      responseMessage = `❌ Error: ${result.message}`;
    }

    await sendMessage(chatId, responseMessage);

    return res.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    // Always return 200 to Telegram to avoid retries
    return res.json({ ok: true, error: error.message });
  }
});

/**
 * Handle bot commands
 */
async function handleCommand(chatId: number, command: string): Promise<void> {
  const [cmd, ...args] = command.split(" ");

  switch (cmd.toLowerCase()) {
    case "/start":
      await sendMessage(
        chatId,
        `🌴 Welcome to IslandLoaf!\n\nI can help you with:
- Vendor onboarding
- Booking requests
- Calendar sync
- Support tickets
- And more!

Type /help for more info.`
      );
      break;

    case "/help":
      await sendMessage(
        chatId,
        `🤖 IslandLoaf Bot Commands

/start - Start the bot
/help - Show this message
/status - Check system status

You can also send natural language requests like:
- "Add a new vendor: email@example.com"
- "Create booking for John Doe"
- "Help with payment issue"

I'll automatically route your request to the right agent!`
      );
      break;

    case "/status":
      await sendMessage(
        chatId,
        `📊 System Status

✅ Bot: Online
✅ Task Queue: Active
🤖 Agents: Ready

Send me a request and I'll process it!`
      );
      break;

    default:
      await sendMessage(
        chatId,
        `Unknown command: ${cmd}\n\nType /help for available commands.`
      );
  }
}

/**
 * Detect lead type from message text
 */
function detectLeadType(text: string): string {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("vendor") ||
    lowerText.includes("onboard") ||
    lowerText.includes("signup") ||
    lowerText.includes("register")
  ) {
    return "vendor_signup";
  }

  if (
    lowerText.includes("booking") ||
    lowerText.includes("book") ||
    lowerText.includes("reservation") ||
    lowerText.includes("reserve")
  ) {
    return "booking_request";
  }

  if (
    lowerText.includes("calendar") ||
    lowerText.includes("sync") ||
    lowerText.includes("ical")
  ) {
    return "calendar_sync";
  }

  if (
    lowerText.includes("price") ||
    lowerText.includes("pricing") ||
    lowerText.includes("cost")
  ) {
    return "pricing_update";
  }

  if (
    lowerText.includes("marketing") ||
    lowerText.includes("campaign") ||
    lowerText.includes("content")
  ) {
    return "marketing_request";
  }

  if (
    lowerText.includes("support") ||
    lowerText.includes("help") ||
    lowerText.includes("issue") ||
    lowerText.includes("problem")
  ) {
    return "support_issue";
  }

  if (
    lowerText.includes("payment") ||
    lowerText.includes("checkout") ||
    lowerText.includes("pay") ||
    lowerText.includes("refund")
  ) {
    return "payment_request";
  }

  return "general_inquiry";
}

/**
 * Extract structured data from message text
 */
function extractLeadData(text: string, from: any): Record<string, any> {
  const data: Record<string, any> = {
    rawMessage: text,
    telegramUser: {
      id: from.id,
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
    },
  };

  // Extract email if present
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    data.email = emailMatch[0];
  }

  // Extract phone number if present
  const phoneMatch = text.match(/\+?\d{10,15}/);
  if (phoneMatch) {
    data.phone = phoneMatch[0];
  }

  // Extract dates if present (simple format: YYYY-MM-DD)
  const dateMatches = text.match(/\d{4}-\d{2}-\d{2}/g);
  if (dateMatches && dateMatches.length >= 2) {
    data.startDate = dateMatches[0];
    data.endDate = dateMatches[1];
  }

  // Extract amounts if present
  const amountMatch = text.match(/\$?\d+(\.\d{2})?/);
  if (amountMatch) {
    data.amount = parseFloat(amountMatch[0].replace("$", ""));
  }

  return data;
}

export default router;



