import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fetchNotifications, fetchSimpleSystemLogs, markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/api";
import { format } from "date-fns";
import { useApiQuery } from "@/lib/api-hooks";
import type { Notification, SimpleSystemLog } from "@shared/types/notifications";
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  CheckCheck, 
  Clock, 
  Calendar, 
  User, 
  CreditCard,
  FileText,
  Settings2
} from "lucide-react";

export default function Notifications() {
  const queryClient = useQueryClient();
  
  // Get notifications
  const { data: notifications, isLoading } = useApiQuery({
    key: ["/api/notifications"] as const,
    fn: async () => fetchNotifications(),
  });
  
  // Get system logs
  const { data: systemLogs, isLoading: isLogsLoading } = useApiQuery({
    key: ["/api/system-logs"] as const,
    fn: async () => fetchSimpleSystemLogs(),
  });
  
  // Mark all notifications as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return markAllNotificationsAsRead(queryClient);
    },
    onSuccess: () => {
      toast({
        title: "Notifications marked as read",
        description: "All notifications have been marked as read.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark notifications as read",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Mark single notification as read mutation
  const markSingleReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return markNotificationAsRead(notificationId, queryClient);
    },
    onSuccess: () => {
      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark notification as read",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  

  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getSystemLogIcon = (action: string) => {
    if (action.includes("Profile")) return <User className="h-5 w-5 text-purple-500" />;
    if (action.includes("Price") || action.includes("Payment")) return <CreditCard className="h-5 w-5 text-green-500" />;
    if (action.includes("Calendar")) return <Calendar className="h-5 w-5 text-blue-500" />;
    if (action.includes("Booking")) return <FileText className="h-5 w-5 text-amber-500" />;
    if (action.includes("Login")) return <CheckCheck className="h-5 w-5 text-green-500" />;
    return <Settings2 className="h-5 w-5 text-neutral-500" />;
  };
  
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Notifications & Logs</h1>
      
      <Tabs defaultValue="notifications">
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center mb-6">
          <TabsList>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="system-logs">System Logs</TabsTrigger>
          </TabsList>
          
          <div className="mb-4 sm:mb-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
          </div>
        </div>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-neutral-500">Loading notifications...</p>
                  </div>
                ) : !notifications || notifications.length === 0 ? (
                  <div className="text-center p-8 border rounded-md bg-neutral-50">
                    <Bell className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">No notifications</h3>
                    <p className="text-neutral-500 mb-4">
                      You're all caught up! New notifications will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification: Notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex p-4 border rounded-md ${notification.read ? "" : "bg-blue-50 border-blue-100"}`}
                    >
                      <div className="mr-4 mt-1">
                        {getNotificationIcon(notification.type || 'info')}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                          <h3 className="font-medium">{notification.title}</h3>
                          <span className="text-sm text-neutral-500 mt-1 sm:mt-0">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-neutral-700 mt-1">{notification.message}</p>
                        
                        <div className="flex justify-end mt-2">
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markSingleReadMutation.mutate(notification.id)}
                              disabled={markSingleReadMutation.isPending}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Logs Tab */}
        <TabsContent value="system-logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLogsLoading ? (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-neutral-500">Loading system logs...</p>
                  </div>
                ) : !systemLogs || systemLogs.length === 0 ? (
                  <div className="text-center p-8 border rounded-md bg-neutral-50">
                    <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">No activity logs</h3>
                    <p className="text-neutral-500 mb-4">
                      System activity logs will appear here.
                    </p>
                  </div>
                ) : (
                  systemLogs.map((log: SimpleSystemLog) => (
                    <div key={log.id} className="flex p-4 border rounded-md">
                      <div className="mr-4 mt-1">
                        {getSystemLogIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                          <h3 className="font-medium">{log.action}</h3>
                          <span className="text-sm text-neutral-500 mt-1 sm:mt-0">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-neutral-700 mt-1">{log.details}</p>
                        <p className="text-sm text-neutral-500 mt-1">
                          User: {log.user}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
