// server/services/telegramClient.ts
import axios from "axios";

const TELEGRAM_API_BASE = "https://api.telegram.org";

/**
 * Send a message to a Telegram chat
 */
export async function sendMessage(
  chatId: number,
  text: string,
  options?: {
    parseMode?: "Markdown" | "HTML";
    replyToMessageId?: number;
  }
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn("TELEGRAM_BOT_TOKEN not configured. Cannot send message.");
    console.log(`[Mock Telegram] To chat ${chatId}: ${text}`);
    return false;
  }

  try {
    const url = `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`;

    const payload: any = {
      chat_id: chatId,
      text,
    };

    if (options?.parseMode) {
      payload.parse_mode = options.parseMode;
    }

    if (options?.replyToMessageId) {
      payload.reply_to_message_id = options.replyToMessageId;
    }

    const response = await axios.post(url, payload);

    if (response.data.ok) {
      console.log(`✉️  Telegram message sent to chat ${chatId}`);
      return true;
    } else {
      console.error("Telegram API error:", response.data);
      return false;
    }
  } catch (error: any) {
    console.error("Failed to send Telegram message:", error.message);
    return false;
  }
}

/**
 * Set webhook URL (typically called during setup)
 */
export async function setWebhook(webhookUrl: string, secretToken?: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn("TELEGRAM_BOT_TOKEN not configured. Cannot set webhook.");
    return false;
  }

  try {
    const url = `${TELEGRAM_API_BASE}/bot${botToken}/setWebhook`;

    const payload: any = {
      url: webhookUrl,
    };

    if (secretToken) {
      payload.secret_token = secretToken;
    }

    const response = await axios.post(url, payload);

    if (response.data.ok) {
      console.log(`✅ Telegram webhook set to: ${webhookUrl}`);
      return true;
    } else {
      console.error("Telegram setWebhook error:", response.data);
      return false;
    }
  } catch (error: any) {
    console.error("Failed to set Telegram webhook:", error.message);
    return false;
  }
}

/**
 * Get webhook info (for debugging)
 */
export async function getWebhookInfo(): Promise<any> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn("TELEGRAM_BOT_TOKEN not configured.");
    return null;
  }

  try {
    const url = `${TELEGRAM_API_BASE}/bot${botToken}/getWebhookInfo`;
    const response = await axios.get(url);

    if (response.data.ok) {
      return response.data.result;
    } else {
      console.error("Telegram getWebhookInfo error:", response.data);
      return null;
    }
  } catch (error: any) {
    console.error("Failed to get webhook info:", error.message);
    return null;
  }
}



