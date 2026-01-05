import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useApiQuery } from "@/lib/api-hooks";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { fetchBookingAnalytics, fetchDashboardStats } from "@/lib/api";

// Create a basic stat card component for the admin dashboard
const StatCard = ({ title, value, icon, iconColor, iconBgColor, trend, subtitle }: {
  title: string;
  value: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  trend?: { value: string; isPositive: boolean };
  subtitle?: string;
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-1">
                <span className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.value}
                </span>
                {subtitle && <span className="text-xs text-muted-foreground ml-1">{subtitle}</span>}
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconColor}>
              {icon === 'users' && (
                <>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </>
              )}
              {icon === 'dollar-sign' && (
                <>
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </>
              )}
              {icon === 'calendar' && (
                <>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </>
              )}
              {icon === 'trending-up' && (
                <>
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </>
              )}
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useApiQuery({
    key: ["/api/dashboard/stats"],
    fn: () => fetchDashboardStats(),
    options: {
      refetchInterval: 30000,
      retry: false,
    },
  });

  // Fetch booking analytics
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useApiQuery({
    key: ["/api/dashboard/booking-analytics"],
    fn: () => fetchBookingAnalytics(),
    options: {
      refetchInterval: 30000,
      retry: false,
    },
  });

  // Handle authentication errors
  useEffect(() => {
    if (statsError || analyticsError) {
      const error = statsError || analyticsError;
      if (error?.message?.includes('401')) {
        toast({
          title: "Authentication required",
          description: "Please log in to access the dashboard",
          variant: "destructive"
        });
        navigate('/admin/login');
      }
    }
  }, [statsError, analyticsError, navigate, toast]);

  // Handle additional admin actions when needed
  useEffect(() => {
    // Clear any persisted vendor ID when returning to the dashboard
    localStorage.removeItem("vendorId");
  }, []);

  // Handle report generation using the API endpoint
  const handleGenerateReport = async () => {
    try {
      toast({
        title: "Generating report",
        description: "Your report is being prepared and will download shortly"
      });
      
      // Call the API endpoint
      const response = await fetch('/api/reports/generate');
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'islandloaf_report.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report downloaded",
        description: "Your report has been generated successfully",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error generating report",
        description: "There was a problem generating your report. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle login
  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'admin@islandloaf.com', 
          password: 'admin123' 
        }),
        credentials: 'include'
      });

      if (response.ok) {
        window.location.reload(); // Refresh to load dashboard with auth
      } else {
        toast({
          title: "Login failed",
          description: "Please check your credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "Unable to connect to server",
        variant: "destructive"
      });
    }
  };

  // Show login prompt if not authenticated
  if (statsError?.message?.includes('401') || analyticsError?.message?.includes('401')) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Authentication Required</h2>
              <p className="text-muted-foreground">Please log in to access the admin dashboard</p>
              <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
                Login as Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (statsLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Prepare data for charts
  const businessTypeData = analytics?.businessTypes
    ? Object.entries(analytics.businessTypes).map(([name, value]) => ({ name, value }))
    : [];
  
  const statusData = analytics?.statusDistribution
    ? Object.entries(analytics.statusDistribution).map(([name, value]) => ({ name, value }))
    : [];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={handleGenerateReport} variant="outline">
            Generate Report
          </Button>
          <Button onClick={() => navigate('/admin/vendor-management')}>
            Manage Vendors
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vendors"
          value={stats?.totalVendors?.toString() || '0'}
          icon="users"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{ value: `${stats?.activeVendors || 0} active`, isPositive: true }}
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings?.toString() || '0'}
          icon="calendar"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{ value: `${stats?.confirmedBookings || 0} confirmed`, isPositive: true }}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue || 0}`}
          icon="dollar-sign"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={{ value: `${stats?.completedBookings || 0} completed`, isPositive: true }}
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingVendors?.toString() || '0'}
          icon="trending-up"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          trend={{ value: `${stats?.inactiveVendors || 0} inactive`, isPositive: false }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Business Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Business Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={businessTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, value}) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {businessTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topVendors?.map((vendor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{vendor.name}</p>
                    <p className="text-sm text-gray-600">{vendor.bookings} bookings</p>
                  </div>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              )) || (
                <p className="text-gray-500">No booking data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentBookings?.map((booking, index) => (
              <div key={index} className="flex items-center justify-between p-3 border-b">
                <div>
                  <p className="font-medium">Booking #{booking.id}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={booking.status === 'confirmed' ? 'default' : 
                            booking.status === 'pending' ? 'secondary' : 
                            booking.status === 'completed' ? 'outline' : 'destructive'}
                  >
                    {booking.status}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">${booking.price || 0}</p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500">No recent bookings</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats?.vendorStats?.map((vendor, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{vendor.name}</p>
                  <Badge 
                    variant={vendor.role === 'vendor' ? 'default' : 
                            vendor.role === 'pending' ? 'secondary' : 'outline'}
                  >
                    {vendor.role}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{vendor.businessType}</p>
                <p className="text-sm text-gray-600">{vendor.bookingCount} bookings</p>
              </div>
            )) || (
              <p className="text-gray-500">No vendor data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;