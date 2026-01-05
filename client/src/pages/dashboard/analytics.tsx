import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Download, BarChart3, PieChart, LineChart, Filter, RefreshCw } from "lucide-react";
import { format, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import StatCard from "@/components/dashboard/stat-card";
import { useToast } from "@/hooks/use-toast";
import {
  fetchBusinessBookings,
  fetchBusinessPayments,
  fetchBusinessReports,
  fetchBusinessVendors,
  fetchBookingAnalytics,
  fetchDashboardStats,
  fetchRevenueAnalytics,
} from "@/lib/api";
import { useApiQuery } from "@/lib/api-hooks";
import type {
  BusinessBooking,
  BusinessDailyReport,
  BusinessPayment,
  BusinessVendor,
} from "@shared/types/business";

export default function Analytics() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Format dates for display
  const formattedStartDate = format(startDate, "MMM d, yyyy");
  const formattedEndDate = format(endDate, "MMM d, yyyy");

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useApiQuery({
    key: ["/api/dashboard/stats"],
    fn: () => fetchDashboardStats(),
    options: { refetchInterval: 30000 },
  });

  // Fetch booking analytics
  const { data: bookingAnalytics, isLoading: bookingLoading, refetch: refetchBookings } = useApiQuery({
    key: ["/api/dashboard/booking-analytics"],
    fn: () => fetchBookingAnalytics(),
    options: { refetchInterval: 30000 },
  });

  // Fetch revenue analytics
  const { data: revenueAnalytics, isLoading: revenueLoading, refetch: refetchRevenue } = useApiQuery({
    key: ["/api/revenue/analytics"],
    fn: () => fetchRevenueAnalytics(),
    options: { refetchInterval: 30000 },
  });

  // Fetch business data for additional analytics
  const { data: businessVendors, isLoading: vendorsLoading } = useApiQuery({
    key: ["/api/business/vendors"],
    fn: () => fetchBusinessVendors(),
    options: { refetchInterval: 30000 },
  });

  const { data: businessBookings, isLoading: businessBookingsLoading } = useApiQuery({
    key: ["/api/business/bookings"],
    fn: () => fetchBusinessBookings(),
    options: { refetchInterval: 30000 },
  });

  const { data: businessPayments, isLoading: businessPaymentsLoading } = useApiQuery({
    key: ["/api/business/payments"],
    fn: () => fetchBusinessPayments(),
    options: { refetchInterval: 30000 },
  });

  const { data: businessReports, isLoading: businessReportsLoading } = useApiQuery({
    key: ["/api/business/reports"],
    fn: () => fetchBusinessReports(),
    options: { refetchInterval: 30000 },
  });

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/revenue/export", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      return blob;
    },
    onSuccess: (blob) => {
      // Handle file download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Analytics report has been downloaded",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    },
  });

  // Refresh all data
  const handleRefreshAll = () => {
    refetchStats();
    refetchBookings();
    refetchRevenue();
    queryClient.invalidateQueries({ queryKey: ['/api/business'] });
    toast({
      title: "Data Refreshed",
      description: "All analytics data has been refreshed",
    });
  };
  
  // Process revenue data from business reports
  const revenueData = businessReports?.data
    ? businessReports.data
        .map((report: BusinessDailyReport) => ({
          name: format(new Date(report.date), "MMM"),
          revenue: report.totalRevenue ?? 0,
          bookings: report.totalBookings ?? 0,
          date: report.date,
        }))
        .slice(0, 12)
    : [];
  
  // Process service type breakdown from business bookings
  const serviceTypeData = businessBookings?.data
    ? (() => {
        const categoryCount: Record<string, number> = {};
        businessBookings.data.forEach((booking: BusinessBooking) => {
          // Postgres-backed business booking payload doesn't include a service category;
          // group by serviceId as a stable fallback.
          const category = Number.isFinite(booking.serviceId) ? `Service ${booking.serviceId}` : "Other";
          categoryCount[category] = (categoryCount[category] ?? 0) + 1;
        });
    
        const total = businessBookings.data.length;
        const colors = ["#3A7CA5", "#81C3D7", "#F5C765", "#9966CC", "#ADB5BD"];
    
        return Object.entries(categoryCount).map(([name, count], index) => ({
          name,
          value: Math.round((count / total) * 100),
          color: colors[index % colors.length],
        }));
      })()
    : [];
  
  // Process booking source data (assuming direct bookings for now)
  const bookingSourceData = businessBookings?.data ? [
    { name: "Direct", value: 85, color: "#3A7CA5" },
    { name: "Partners", value: 10, color: "#81C3D7" },
    { name: "Social", value: 3, color: "#9966CC" },
    { name: "Other", value: 2, color: "#ADB5BD" }
  ] : [];
  
  // Process booking status data from business bookings
  const bookingStatusData = businessBookings?.data
    ? (() => {
        const statusCount: Record<string, number> = {};
        businessBookings.data.forEach((booking: BusinessBooking) => {
          const status = booking.status ?? "Pending";
          statusCount[status] = (statusCount[status] ?? 0) + 1;
        });
    
        const colors: Record<string, string> = {
          completed: "#3A7CA5",
          confirmed: "#4CAF50",
          pending: "#F5C765",
          cancelled: "#EF5350",
        };
    
        return Object.entries(statusCount).map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          bookings: count,
          color: colors[name.toLowerCase()] ?? "#ADB5BD",
        }));
      })()
    : [];

  // Calculate totals from real data
  const totalRevenue =
    businessPayments?.data?.reduce((sum: number, payment: BusinessPayment) => sum + (payment.amount ?? 0), 0) ?? 0;
  const totalBookings = businessBookings?.data?.length ?? 0;
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const commissionPaid =
    businessPayments?.data?.reduce((sum: number, payment: BusinessPayment) => sum + (payment.commission ?? 0), 0) ?? 0;
  const vendorCount = businessVendors?.data?.length ?? 0;

  // Loading state
  const isLoading = statsLoading || bookingLoading || revenueLoading || vendorsLoading || businessBookingsLoading || businessPaymentsLoading || businessReportsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Analytics & Reports</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setTimeframe(timeframe === 'month' ? 'year' : 'month')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formattedStartDate} - {formattedEndDate}
          </Button>
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => exportMutation.mutate()} 
            disabled={exportMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportMutation.isPending ? "Exporting..." : "Export Report"}
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon="ri-money-dollar-circle-line"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{ value: "8.2% vs previous period", isPositive: true }}
        />
        
        <StatCard
          title="Total Bookings"
          value={totalBookings.toString()}
          icon="ri-calendar-check-line"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{ value: "4.3% vs previous period", isPositive: true }}
        />
        
        <StatCard
          title="Average Booking Value"
          value={`$${avgBookingValue.toFixed(2)}`}
          icon="ri-line-chart-line"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={{ value: "3.7% vs previous period", isPositive: true }}
        />
        
        <StatCard
          title="Commission Paid"
          value={`$${commissionPaid.toLocaleString()}`}
          icon="ri-percent-line"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          subtitle="10% platform fee"
        />
      </div>
      
      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Revenue Trend</CardTitle>
              <Select 
                defaultValue={timeframe} 
                onValueChange={(value: "week" | "month" | "year") => setTimeframe(value)}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={revenueData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E9ECEF' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      domain={[0, 'dataMax + 5']}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue ($)"
                      stroke="#3A7CA5"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bookings"
                      name="Bookings"
                      stroke="#F5C765"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Service Type Breakdown */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Service Breakdown</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Filter className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={serviceTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {serviceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {serviceTypeData.map((entry, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <span 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: entry.color }}
                      ></span>
                      <span className="text-neutral-700 mr-1">{entry.name}:</span>
                      <span className="font-medium">{entry.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Secondary Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Sources */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Booking Sources</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bookingSourceData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {bookingSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Booking Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Booking Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bookingStatusData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" radius={[4, 4, 0, 0]}>
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
