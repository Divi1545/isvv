import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CalendarOverview from "@/components/dashboard/calendar-overview";

const CalendarSync = () => {
  const { toast } = useToast();
  
  async function handleSyncAllCalendars() {
    try {
      await fetch('/api/calendar/sync-all', { method: 'POST' });
      toast({
        title: "Calendar sync initiated",
        description: "Sync started for all connected calendars"
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "There was an error syncing your calendars",
        variant: "destructive"
      });
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Calendar Sync</h1>
        <Button 
          className="w-full md:w-auto"
          onClick={handleSyncAllCalendars}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M21 12a9 9 0 0 1-9 9"></path>
            <path d="M9 3a9 9 0 0 1 9 9"></path>
            <path d="m3 9 3 3"></path>
            <path d="M3 9a9 9 0 0 1 9-9"></path>
            <path d="m21 15-3-3"></path>
          </svg>
          Sync All Calendars
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Connected Calendars</h3>
              <div className="space-y-3">
                {[
                  { name: 'Airbnb Calendar', type: 'Airbnb', lastSync: '10 minutes ago', status: 'success' },
                  { name: 'Google Calendar', type: 'Google', lastSync: '1 hour ago', status: 'success' },
                  { name: 'Booking.com', type: 'Booking.com', lastSync: 'Failed', status: 'error' }
                ].map((calendar, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        calendar.type === 'Airbnb' ? 'bg-red-100' : 
                        calendar.type === 'Google' ? 'bg-blue-100' : 
                        'bg-yellow-100'
                      }`}>
                        <i className={`
                          ${calendar.type === 'Airbnb' ? 'ri-home-4-line text-red-600' : 
                            calendar.type === 'Google' ? 'ri-google-line text-blue-600' : 
                            'ri-building-line text-yellow-600'}
                        `}></i>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{calendar.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {calendar.status === 'success' ? (
                            <span className="text-green-600">Synced {calendar.lastSync}</span>
                          ) : (
                            <span className="text-red-600">Sync failed</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <i className="ri-refresh-line mr-1"></i> Sync
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Add New Calendar</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calendar Name</label>
                  <Input placeholder="e.g. Airbnb Calendar" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calendar Type</label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select calendar type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="booking">Booking.com</SelectItem>
                      <SelectItem value="google">Google Calendar</SelectItem>
                      <SelectItem value="ical">iCal URL</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calendar URL (iCal)</label>
                  <Input placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Associated Service</label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beachvilla">Beach Villa</SelectItem>
                      <SelectItem value="gardenroom">Garden Room</SelectItem>
                      <SelectItem value="oceanview">Ocean View Suite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Add Calendar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Calendar Overview</h3>
            <CalendarOverview />
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Booked</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                <span className="text-sm">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarSync;