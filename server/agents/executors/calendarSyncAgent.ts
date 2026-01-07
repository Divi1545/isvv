// server/agents/executors/calendarSyncAgent.ts
import * as storage from "../../storage-adapter";

export interface CalendarSyncResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute calendar sync task
 */
export async function executeTask(taskInput: Record<string, any>): Promise<CalendarSyncResult> {
  const action = taskInput.action;

  try {
    switch (action) {
      case "add_source":
        return await addCalendarSource(taskInput);

      case "sync_calendar":
        return await syncCalendar(taskInput);

      case "validate_url":
        return await validateCalendarUrl(taskInput);

      default:
        return {
          success: false,
          error: `Unknown calendar action: ${action}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Calendar sync task failed",
    };
  }
}

async function addCalendarSource(data: Record<string, any>): Promise<CalendarSyncResult> {
  const { userId, serviceId, name, url, type } = data;

  if (!userId || !name || !url || !type) {
    return {
      success: false,
      error: "Missing required fields: userId, name, url, type",
    };
  }

  const calendarSource = await storage.createCalendarSource({
    userId,
    serviceId: serviceId || null,
    name,
    url,
    type,
  });

  return {
    success: true,
    data: {
      calendarSourceId: calendarSource.id,
      name,
      type,
      url,
    },
  };
}

async function syncCalendar(data: Record<string, any>): Promise<CalendarSyncResult> {
  const { calendarSourceId } = data;

  if (!calendarSourceId) {
    return {
      success: false,
      error: "Missing calendarSourceId",
    };
  }

  // Check if syncCalendarFromUrl is available (from icalExtensions)
  if ((storage as any).syncCalendarFromUrl) {
    const syncResult = await (storage as any).syncCalendarFromUrl(calendarSourceId);

    return {
      success: syncResult.success,
      data: syncResult,
      error: syncResult.success ? undefined : syncResult.message,
    };
  } else {
    return {
      success: false,
      error: "Calendar sync functionality not available (iCal extensions not loaded)",
    };
  }
}

async function validateCalendarUrl(data: Record<string, any>): Promise<CalendarSyncResult> {
  const { url } = data;

  if (!url) {
    return {
      success: false,
      error: "Missing url",
    };
  }

  // Basic URL validation
  try {
    const parsedUrl = new URL(url);
    const isValid = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";

    return {
      success: true,
      data: {
        url,
        valid: isValid,
        protocol: parsedUrl.protocol,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Invalid URL format",
    };
  }
}



