import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { addCalendarSource, deleteCalendarSource, fetchCalendarSources, fetchServicesList, syncCalendar } from "@/lib/api";
import { useApiQuery } from "@/lib/api-hooks";
import type { CalendarSource } from "@shared/types/calendar";
import type { ServiceListItem } from "@shared/types/services";
import { format } from "date-fns";
import { Loader2, RefreshCw, Trash2, PlusCircle, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const addCalendarSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Please enter a valid URL"),
  type: z.string().min(1, "Type is required"),
  serviceId: z.string().optional(),
});

type FormValues = z.infer<typeof addCalendarSourceSchema>;

export default function CalendarSync() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Get calendar sources
  const { data: calendarSources, isLoading, error, refetch } = useApiQuery({
    key: ["/api/calendar-sources"] as const,
    fn: async () => fetchCalendarSources(),
  });
  
  // Get services for dropdown
  const { data: services } = useApiQuery({
    key: ["/api/services"] as const,
    fn: async () => fetchServicesList(),
  });
  
  // Add calendar source mutation
  const addSourceMutation = useMutation({
    mutationFn: addCalendarSource,
    onSuccess: () => {
      toast({
        title: "Calendar source added",
        description: "Your calendar source has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-sources'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add calendar source",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Sync calendar mutation
  const syncCalendarMutation = useMutation({
    mutationFn: syncCalendar,
    onSuccess: (data) => {
      toast({
        title: "Calendar synced",
        description: data.message || "Your calendar has been synced successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-sources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-events'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to sync calendar",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete calendar source mutation
  const deleteSourceMutation = useMutation({
    mutationFn: deleteCalendarSource,
    onSuccess: () => {
      toast({
        title: "Calendar source deleted",
        description: "The calendar source has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-sources'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete calendar source",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(addCalendarSourceSchema),
    defaultValues: {
      name: "",
      url: "",
      type: "",
      serviceId: "",
    },
  });
  
  function onSubmit(data: FormValues) {
    addSourceMutation.mutate({
      name: data.name,
      url: data.url,
      type: data.type,
      serviceId: data.serviceId && data.serviceId !== "none" ? parseInt(data.serviceId) : undefined,
    });
  }
  
  function handleSyncCalendar(sourceId: number) {
    syncCalendarMutation.mutate(sourceId);
  }

  function handleDeleteCalendarSource(sourceId: number) {
    deleteSourceMutation.mutate(sourceId);
  }
  
  // Use real data from the database
  const displaySources = calendarSources || [];
  const displayServices = services || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Calendar Sync"
          description="Connect and sync external calendars"
        />
        <CardSkeleton count={2} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Calendar Sync"
          description="Connect and sync external calendars"
        />
        <ErrorState 
          message={error instanceof Error ? error.message : "Failed to load calendar sources"}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Calendar Sync"
        description="Connect external calendars to automatically sync your availability and prevent double-bookings"
        action={{
          label: "Add Calendar",
          onClick: () => setIsDialogOpen(true),
          icon: <PlusCircle className="h-4 w-4" />,
        }}
      />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Calendar Source</DialogTitle>
            <DialogDescription>
              Connect an external calendar to sync bookings and blocked dates.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Google Calendar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>iCal URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://calendar.google.com/calendar/ical/..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the iCal/ICS URL from your external calendar service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a calendar type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="google">Google Calendar</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="booking.com">Booking.com</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associated Service (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific service</SelectItem>
                        {displayServices.map((service: ServiceListItem) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Connect this calendar to a specific service, or leave empty to apply to all
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={addSourceMutation.isPending}
            >
              {addSourceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Calendar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {displaySources.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No calendars connected"
          description="Connect external calendars from Airbnb, Booking.com, Google Calendar, and more to automatically sync your availability and prevent double-bookings."
          action={{
            label: "Add Your First Calendar",
            onClick: () => setIsDialogOpen(true)
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connected Calendars</CardTitle>
                <CardDescription>
                  {displaySources.length} calendar{displaySources.length !== 1 ? 's' : ''} connected
                </CardDescription>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  displaySources.forEach(source => handleSyncCalendar(source.id));
                }}
                disabled={syncCalendarMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displaySources.map((source) => {
                const isNeverSynced = !source.lastSynced;
                const lastSyncDate = source.lastSynced ? new Date(source.lastSynced) : null;
                const isRecentlysynced = lastSyncDate && (Date.now() - lastSyncDate.getTime()) < 3600000; // Last hour
                
                return (
                  <Card key={source.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: isRecentlysynced ? 'rgb(34, 197, 94)' : 'transparent' }}>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base">{source.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {source.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mb-2">
                              {source.url}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                {isNeverSynced ? (
                                  <>
                                    <AlertCircle className="h-3 w-3 text-orange-500" />
                                    <span>Never synced</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    <span>Last synced: {format(lastSyncDate!, "MMM d, h:mm a")}</span>
                                  </>
                                )}
                              </div>
                              <div>
                                Service: {displayServices.find((s: ServiceListItem) => s.id === source.serviceId)?.title || "All Services"}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSyncCalendar(source.id)}
                            disabled={syncCalendarMutation.isPending}
                          >
                            {syncCalendarMutation.isPending && syncCalendarMutation.variables === source.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sync
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCalendarSource(source.id)}
                            disabled={deleteSourceMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
