import { IStorage } from '../storage';
import axios from 'axios';
import { CalendarEvent, InsertCalendarEvent } from '@shared/schema';

interface ICalEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  created?: Date;
  status?: string;
}

/**
 * Parse iCal string into CalendarEvent objects
 * This is a simplified parser for demo purposes
 */
function parseICalString(icalString: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const eventBlocks = icalString.split('BEGIN:VEVENT');
  
  // Skip the first block (it's the header)
  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i];
    const lines = block.split('\n');
    
    let uid = '';
    let summary = '';
    let start: Date | null = null;
    let end: Date | null = null;
    let created: Date | null = null;
    let status = '';
    
    for (const line of lines) {
      if (line.startsWith('UID:')) {
        uid = line.substring(4).trim();
      } else if (line.startsWith('SUMMARY:')) {
        summary = line.substring(8).trim();
      } else if (line.startsWith('DTSTART:')) {
        const dateStr = line.substring(8).trim();
        start = parseICalDate(dateStr);
      } else if (line.startsWith('DTEND:')) {
        const dateStr = line.substring(6).trim();
        end = parseICalDate(dateStr);
      } else if (line.startsWith('CREATED:')) {
        const dateStr = line.substring(8).trim();
        created = parseICalDate(dateStr);
      } else if (line.startsWith('STATUS:')) {
        status = line.substring(7).trim().toLowerCase();
      }
    }
    
    if (uid && summary && start && end) {
      events.push({ uid, summary, start, end, created: created || new Date(), status });
    }
  }
  
  return events;
}

/**
 * Parse iCal date format to JavaScript Date
 * Format: YYYYMMDDTHHmmssZ or YYYYMMDD
 */
function parseICalDate(dateStr: string): Date {
  dateStr = dateStr.trim();
  
  if (dateStr.includes('T')) {
    // Format: YYYYMMDDTHHmmssZ
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(9, 11));
    const minute = parseInt(dateStr.substring(11, 13));
    const second = parseInt(dateStr.substring(13, 15));
    
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  } else {
    // Format: YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(dateStr.substring(6, 8));
    
    return new Date(Date.UTC(year, month, day));
  }
}

/**
 * Extend storage with iCal support
 */
export function extendStorageWithIcalSupport(storage: IStorage): void {
  /**
   * Sync calendar from external iCal URL
   */
  const syncCalendarFromUrl = async (calendarSourceId: number): Promise<{ success: boolean; message: string }> => {
    try {
      // Get calendar source
      const calendarSource = await storage.getCalendarSources(1);
      const source = calendarSource.find(s => s.id === calendarSourceId);
      
      if (!source) {
        return { success: false, message: 'Calendar source not found' };
      }
      
      // Fetch iCal data from URL
      const response = await axios.get(source.url);
      if (response.status !== 200) {
        return { success: false, message: `Failed to fetch calendar data: ${response.statusText}` };
      }
      
      const icalString = response.data;
      const events = parseICalString(icalString);
      
      // Process events
      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const event of events) {
        // Check if event already exists by external ID
        const existingEvents = await storage.getCalendarEvents(source.userId);
        const existingEvent = existingEvents.find(e => e.externalId === event.uid);
        
        const eventData: InsertCalendarEvent = {
          userId: source.userId,
          serviceId: source.serviceId,
          startDate: event.start,
          endDate: event.end,
          title: event.summary,
          isBooked: event.status === 'confirmed',
          isPending: event.status === 'tentative',
          isBlocked: false,
          source: source.type,
          externalId: event.uid
        };
        
        if (existingEvent) {
          // Update existing event
          await storage.updateCalendarEvent(existingEvent.id, eventData);
          updatedCount++;
        } else {
          // Create new event
          await storage.createCalendarEvent(eventData);
          addedCount++;
        }
      }
      
      // Update last synced timestamp
      await storage.updateCalendarSource(source.id, { lastSynced: new Date() });
      
      return { 
        success: true, 
        message: `Calendar synced: ${addedCount} events added, ${updatedCount} events updated, ${skippedCount} events skipped` 
      };
    } catch (error) {
      console.error('Error syncing calendar:', error);
      return { success: false, message: `Error syncing calendar: ${error.message}` };
    }
  };
  
  // Add the method to storage object
  (storage as any).syncCalendarFromUrl = syncCalendarFromUrl;
}