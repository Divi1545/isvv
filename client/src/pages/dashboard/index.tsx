import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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

// Dashboard component
export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch real booking data for the vendor
  const { data: bookings = [], isLoading: bookingsLoading } = useApiQuery({
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
  
  if (bookingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
      
      {/* Welcome alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
          </svg> 
          Welcome back, {user?.fullName || 'Island Vendor'}!
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          Your {user?.businessType || 'tourism'} business has 3 new bookings since your last login. Check your upcoming schedule below.
        </AlertDescription>
      </Alert>
      
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
      
      {/* Revenue chart & Service breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Revenue Trend</h3>
            {revenueData.length > 0 ? (
              <RevenueChart data={revenueData} />
            ) : (
              <p className="text-muted-foreground">No revenue data available</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Service Breakdown</h3>
            {serviceTypes.length > 0 ? (
              <ServiceBreakdown services={serviceTypes} />
            ) : (
              <p className="text-muted-foreground">No service data available</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Calendar overview & Booking sources */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Calendar Overview</h3>
            <CalendarOverview />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Booking Sources</h3>
            <BookingSources sources={bookingSources} />
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming bookings */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">Upcoming Bookings</h3>
          <UpcomingBookings limit={5} />
        </CardContent>
      </Card>
    </div>
  );
}