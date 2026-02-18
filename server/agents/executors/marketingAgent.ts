// server/agents/executors/marketingAgent.ts
import * as storage from "../../storage-adapter";
import OpenAI from "openai";

// Initialize OpenAI if configured
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface MarketingAgentResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute marketing task
 */
export async function executeTask(taskInput: Record<string, any>): Promise<MarketingAgentResult> {
  const action = taskInput.action;

  try {
    switch (action) {
      case "create_campaign":
        return await createCampaign(taskInput);

      case "generate_content":
        return await generateContent(taskInput);

      case "launch_campaign":
        return await launchCampaign(taskInput);

      default:
        return {
          success: false,
          error: `Unknown marketing action: ${action}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Marketing task failed",
    };
  }
}

async function createCampaign(data: Record<string, any>): Promise<MarketingAgentResult> {
  const { title, type, message, targetAudience } = data;

  if (!title || !type || !message) {
    return {
      success: false,
      error: "Missing required fields: title, type, message",
    };
  }

  // Mock campaign creation (in-memory campaigns)
  const campaignId = `CAM-${Date.now()}`;

  return {
    success: true,
    data: {
      campaignId,
      title,
      type,
      status: "draft",
      targetAudience: targetAudience || "all",
      createdAt: new Date().toISOString(),
    },
  };
}

async function generateContent(data: Record<string, any>): Promise<MarketingAgentResult> {
  const { serviceDescription, contentType, targetAudience, tone } = data;

  if (!serviceDescription || !contentType) {
    return {
      success: false,
      error: "Missing serviceDescription or contentType",
    };
  }

  if (!openai) {
    return {
      success: true,
      data: {
        content: `[Mock ${contentType} content for: ${serviceDescription}]`,
        contentType,
        warning: "OpenAI not configured. Returning mock content.",
      },
    };
  }

  // Generate content using OpenAI
  try {
    const prompt = `Generate ${contentType} marketing content for this service:

Service: ${serviceDescription}
Target Audience: ${targetAudience || "general travelers"}
Tone: ${tone || "friendly and professional"}

Requirements:
- Be concise and engaging
- Highlight unique selling points
- Include a call to action
- Match the tone and style for ${contentType}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a marketing copywriter for IslandLoaf, a Sri Lankan tourism marketplace.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || "";

    return {
      success: true,
      data: {
        content,
        contentType,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `OpenAI content generation failed: ${error.message}`,
    };
  }
}

async function launchCampaign(data: Record<string, any>): Promise<MarketingAgentResult> {
  const { campaignId } = data;

  if (!campaignId) {
    return {
      success: false,
      error: "Missing campaignId",
    };
  }

  // Mock campaign launch (in-memory campaigns)
  return {
    success: true,
    data: {
      campaignId,
      status: "active",
      launchedAt: new Date().toISOString(),
    },
  };
}



