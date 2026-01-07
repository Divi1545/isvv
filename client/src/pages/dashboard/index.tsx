import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/loading-skeleton";
import StatCard from "@/components/dashboard/stat-card";
import RevenueChart from "@/components/dashboard/revenue-chart";
import ServiceBreakdown from "@/components/dashboard/service-breakdown";
import UpcomingBookings from "@/components/dashboard/upcoming-bookings";
import BookingSources from "@/components/dashboard/booking-sources";
import CalendarOverview from "@/components/dashboard/calendar-overview";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/lib/api-hooks";
import { fetchBookings } from "@/lib/api";
import type { ApiBooking } from "@shared/types/bookings";
import { Calendar, TrendingUp, Plus, Award } from "lucide-react";

// Dashboard component
export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch real booking data for the vendor
  const { data: bookings = [], isLoading: bookingsLoading, error, refetch } = useApiQuery({
    key: ["/api/bookings"] as const,
    fn: async () => fetchBookings(),
    options: { enabled: !!user },
  });
  
  // Calculate vendor statistics from real data
  const vendorStats = React.useMemo(() => {
    if (!bookings.length) return { totalBookings: 0, totalRevenue: 0, completedBookings: 0, pendingBookings: 0 };
    
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum: number, booking: ApiBooking) => sum + booking.totalPrice, 0);
    const completedBookings = bookings.filter((booking: ApiBooking) => booking.status === 'completed').length;
    const pendingBookings = bookings.filter((booking: ApiBooking) => booking.status === 'pending').length;
    
    return { totalBookings, totalRevenue, completedBookings, pendingBookings };
  }, [bookings]);
  
  // Generate revenue chart data from real bookings
  const revenueData = React.useMemo(() => {
    if (!bookings.length) return [];
    
    const monthlyRevenue = bookings.reduce((acc: Record<string, number>, booking: ApiBooking) => {
      const createdAt = booking.createdAt ?? booking.startDate;
      const month = new Date(createdAt).toLocaleString("default", { month: "short" });
      acc[month] = (acc[month] ?? 0) + booking.totalPrice;
      return acc;
    }, {});
    
    return Object.entries(monthlyRevenue).map(([date, revenue]) => ({ date, revenue }));
  }, [bookings]);
  
  // Get service type breakdown from real data  
  const serviceTypes = React.useMemo(() => {
    if (!bookings.length) return [];
    
    const serviceCount = bookings.reduce((acc: Record<string, number>, booking: ApiBooking) => {
      const type = booking.serviceType ?? "Other";
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});
    
    const total = Object.values(serviceCount).reduce((a, b) => a + b, 0);
    const colors = [
      { bg: "bg-blue-100", text: "text-blue-700" },
      { bg: "bg-green-100", text: "text-green-700" },
      { bg: "bg-amber-100", text: "text-amber-700" },
      { bg: "bg-rose-100", text: "text-rose-700" }
    ];
    
    return Object.entries(serviceCount).map(([type, count], index) => ({
      type,
      percentage: Math.round((count / total) * 100),
      icon: "building",
      color: colors[index % colors.length]
    }));
  }, [bookings]);
  
  // Default booking sources for now (could be calculated from real data later)
  const bookingSources = [
    { name: "Direct", percentage: 40, color: "#4f46e5" },
    { name: "IslandLoaf.com", percentage: 25, color: "#0891b2" },
    { name: "Partner Sites", percentage: 20, color: "#16a34a" },
    { name: "Social Media", percentage: 15, color: "#ea580c" }
  ];
  
  // Loading state
  if (bookingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full" />
        <CardSkeleton count={4} />
        <div className="grid gap-4 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Dashboard"
          description="Overview of your tourism business"
        />
        <ErrorState 
          message={error instanceof Error ? error.message : "Failed to load dashboard data"}
          onRetry={refetch}
        />
      </div>
    );
  }
  
  const hasBookings = bookings && bookings.length > 0;
  const newBookingsCount = bookings.filter((b: ApiBooking) => {
    const createdAt = new Date(b.createdAt || b.startDate);
    const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreated <= 7; // Bookings in last 7 days
  }).length;
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard"
        description={`Welcome back, ${user?.fullName || 'Island Vendor'}! Here's an overview of your ${user?.businessType || 'tourism'} business.`}
        action={{
          label: "New Booking",
          onClick: () => window.location.href = "/dashboard/add-booking",
          icon: <Plus className="h-4 w-4" />,
        }}
      />
      
      {/* Welcome alert - only show if has bookings */}
      {hasBookings && newBookingsCount > 0 && (
        <Alert className="bg-primary/5 border-primary/20">
          <Award className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary flex items-center gap-2">
            Great news! 
          </AlertTitle>
          <AlertDescription>
            You have {newBookingsCount} new {newBookingsCount === 1 ? 'booking' : 'bookings'} in the last 7 days. Check your upcoming schedule below.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue"
          value={`$${vendorStats.totalRevenue.toFixed(2)}`}
          icon="dollar-sign"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{ value: "+12.5%", isPositive: true }}
          subtitle="vs. last month"
        />
        <StatCard 
          title="Bookings"
          value={vendorStats.totalBookings.toString()}
          icon="calendar"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{ value: "+8.2%", isPositive: true }}
          subtitle="vs. last month"
        />
        <StatCard 
          title="Completed"
          value={vendorStats.completedBookings.toString()}
          icon="star"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          trend={{ value: "+0.3", isPositive: true }}
          subtitle="vs. last month"
        />
        <StatCard 
          title="Pending"
          value={vendorStats.pendingBookings.toString()}
          icon="clock"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={{ value: "-2.1%", isPositive: false }}
          subtitle="vs. last month"
        />
      </div>
      
      {/* Empty state if no bookings */}
      {!hasBookings && (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No bookings yet"
          description="Get started by creating your first booking or wait for customers to book your services through IslandLoaf."
          action={{
            label: "Create Your First Booking",
            onClick: () => window.location.href = "/dashboard/add-booking"
          }}
        />
      )}
      
      {/* Revenue chart & Service breakdown */}
      {hasBookings && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueData.length > 0 ? (
                  <RevenueChart data={revenueData} />
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No revenue data available yet</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Service Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {serviceTypes.length > 0 ? (
                  <ServiceBreakdown services={serviceTypes} />
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No service data available yet</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Calendar overview & Booking sources */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Calendar Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarOverview />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Booking Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingSources sources={bookingSources} />
              </CardContent>
            </Card>
          </div>
          
          {/* Upcoming bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingBookings limit={5} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}