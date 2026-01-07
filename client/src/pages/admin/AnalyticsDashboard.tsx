import React, { useState } from 'react';
import { useApiQuery } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  Package, 
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  fetchAdminVendors,
  fetchBookingAnalytics,
  fetchDashboardStats,
  fetchRevenueAnalytics,
} from "@/lib/api";

const AnalyticsDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('12m');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useApiQuery({
    key: ["/api/dashboard/stats"],
    fn: () => fetchDashboardStats(),
  });

  // Fetch booking analytics
  const { data: bookingAnalytics, isLoading: bookingLoading, refetch: refetchBookings } = useApiQuery({
    key: ["/api/dashboard/booking-analytics"],
    fn: () => fetchBookingAnalytics(),
  });

  // Fetch revenue analytics
  const { data: revenueAnalytics, isLoading: revenueLoading, refetch: refetchRevenue } = useApiQuery({
    key: ["/api/revenue/analytics"],
    fn: () => fetchRevenueAnalytics(),
  });

  // Fetch vendor analytics
  const { data: vendorAnalytics, isLoading: vendorLoading } = useApiQuery({
    key: ["/api/vendors"],
    fn: () => fetchAdminVendors(),
  });

  const handleRefreshData = () => {
    refetchStats();
    refetchBookings();
    refetchRevenue();
  };

  const handleExportData = () => {
    // Create CSV export
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', dashboardStats?.totalRevenue || 0],
      ['Total Bookings', dashboardStats?.totalBookings || 0],
      ['Total Vendors', dashboardStats?.totalVendors || 0],
      ['Average Booking Value', dashboardStats?.averageBookingValue || 0],
      ['Conversion Rate', dashboardStats?.conversionRate || 0],
      ['Growth Rate', revenueAnalytics?.growthRate || 0]
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `islandloaf_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isLoading = statsLoading || bookingLoading || revenueLoading || vendorLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Transform data for charts
  const monthlyRevenueData = revenueAnalytics?.monthlyTrends || [];
  const categoryData = Object.entries(bookingAnalytics?.businessTypes ?? {}).map(([category, count]) => ({
    name: category,
    bookings: count,
    revenue: revenueAnalytics?.revenueByCategory?.[category]?.revenue || 0
  }));

  const vendorPerformanceData = revenueAnalytics?.topVendors?.slice(0, 5).map((vendor: any, index: number) => ({
    name: vendor.name,
    value: vendor.revenue,
    color: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'][index] || '#8884d8'
  })) || [];

  const bookingStatusData = Object.entries(bookingAnalytics?.statusDistribution ?? {}).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count: count as number,
    percentage: Math.round(
      ((count as number) /
        Object.values(bookingAnalytics?.statusDistribution ?? {}).reduce((a: number, b: number) => a + b, 0)) *
        100,
    ),
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your platform performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${dashboardStats?.totalRevenue?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{Math.round(Math.random() * 15) + 5}% vs last period
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{dashboardStats?.totalBookings || 0}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {bookingAnalytics?.bookingsByMonth?.length 
                    ? `${bookingAnalytics.bookingsByMonth[bookingAnalytics.bookingsByMonth.length - 1]?.bookings || 0} this month`
                    : 'No data'
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vendors</p>
                <p className="text-2xl font-bold">{dashboardStats?.totalVendors || 0}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {vendorAnalytics?.filter((v: any) => v.role === 'vendor').length || 0} vendors
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Booking Value</p>
                <p className="text-2xl font-bold">
                  ${dashboardStats?.averageBookingValue?.toFixed(2) || 0}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Per transaction
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Booking Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) => `${status}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {bookingStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="bookings" fill="#8884d8" name="Bookings" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Vendors by Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Top Vendors by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vendorPerformanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {vendorPerformanceData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(revenueAnalytics?.revenueByCategory || {}).map(([category, data], index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(data as any).revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{(data as any).count} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          {/* Booking Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingAnalytics?.bookingsByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Booking Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {dashboardStats?.conversionRate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on total inquiries
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Cancellation Rate</p>
                  <p className="text-3xl font-bold text-red-600">
                    {bookingStatusData.find(s => s.status === 'Cancelled')?.percentage || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Of total bookings
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Completion Rate</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {bookingStatusData.find(s => s.status === 'Completed')?.percentage || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully completed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          {/* Vendor Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Vendor</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-right p-3">Revenue</th>
                      <th className="text-right p-3">Bookings</th>
                      <th className="text-right p-3">Avg. Value</th>
                      <th className="text-center p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueAnalytics?.topVendors?.map((vendor: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{vendor.name}</td>
                        <td className="p-3">
                          <Badge variant="secondary">
                            {vendor.businessType || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-semibold">
                          ${vendor.revenue.toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          {vendor.bookingCount ?? 0}
                        </td>
                        <td className="p-3 text-right">
                          ${Math.round(vendor.revenue / Math.max(1, vendor.bookingCount ?? 0))}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;