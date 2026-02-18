import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Revenue summary component
const RevenueSummary = ({ revenueData }: { revenueData: any }) => {
  if (!revenueData) return <div>Loading...</div>;

  const { totalRevenue, totalCommission, pendingPayouts } = revenueData;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-green-600">+{((totalRevenue / 10000) * 100).toFixed(1)}%</span>
                <span className="text-xs text-muted-foreground ml-1">from all bookings</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Platform Commission</p>
              <p className="text-3xl font-bold mt-1">${totalCommission.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-green-600">+{((totalCommission / totalRevenue) * 100).toFixed(1)}%</span>
                <span className="text-xs text-muted-foreground ml-1">commission rate</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
              <p className="text-3xl font-bold mt-1">${pendingPayouts.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-amber-600">{revenueData.topVendors.length} vendors</span>
                <span className="text-xs text-muted-foreground ml-1">to be processed</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Revenue by Category component
const RevenueByCategory = ({ revenueData }: { revenueData: any }) => {
  if (!revenueData) return <div>Loading...</div>;

  const { revenueByCategory, totalRevenue } = revenueData;
  const categories = Object.entries(revenueByCategory);

  const getColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    return colors[index % colors.length];
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-medium text-lg mb-4">Revenue by Category</h3>
        <div className="space-y-4">
          {categories.map(([category, data]: [string, any], index) => {
            const percentage = ((data.revenue / totalRevenue) * 100).toFixed(0);
            return (
              <div key={category} className="flex items-center">
                <div className={`w-3 h-3 ${getColor(index)} rounded-full mr-2`}></div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium capitalize">{category}</p>
                    <p className="text-sm font-medium">${data.revenue.toLocaleString()} ({percentage}%)</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${getColor(index)}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Revenue Chart component
const RevenueChart = ({ revenueData }: { revenueData: any }) => {
  if (!revenueData) return <div>Loading...</div>;

  const { monthlyTrends } = revenueData;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-medium text-lg mb-4">Monthly Revenue Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Top Earning Vendors component
const TopEarningVendors = ({ revenueData }: { revenueData: any }) => {
  if (!revenueData) return <div>Loading...</div>;

  const { topVendors } = revenueData;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-medium text-lg mb-4">Top Earning Vendors</h3>
        <div className="space-y-4">
          {topVendors.slice(0, 5).map((vendor: any, index: number) => (
            <div key={vendor.id} className="flex items-center p-3 rounded-md border">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                <span className="text-sm font-medium">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{vendor.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{vendor.businessType}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">${vendor.revenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">
                  {vendor.bookingCount} bookings
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Commission Settings component
const CommissionSettings = () => {
  const [rates, setRates] = useState({
    accommodation: 10,
    transport: 12,
    tours: 15,
    wellness: 10,
    processing: 2.5
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCommissionMutation = useMutation({
    mutationFn: async (newRates: any) => {
      const response = await apiRequest('POST', '/api/revenue/update-commission', { rates: newRates });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Commission rates updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/revenue/analytics'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission rates",
        variant: "destructive"
      });
    }
  });

  const handleRateChange = (category: string, value: string) => {
    setRates(prev => ({ ...prev, [category]: parseFloat(value) || 0 }));
  };

  const handleUpdateRates = () => {
    updateCommissionMutation.mutate(rates);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-medium text-lg mb-4">Platform Commission Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Accommodation Rate (%)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                <Input 
                  value={rates.accommodation} 
                  onChange={(e) => handleRateChange('accommodation', e.target.value)}
                  className="pl-7" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Transport Rate (%)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                <Input 
                  value={rates.transport} 
                  onChange={(e) => handleRateChange('transport', e.target.value)}
                  className="pl-7" 
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tours & Activities Rate (%)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                <Input 
                  value={rates.tours} 
                  onChange={(e) => handleRateChange('tours', e.target.value)}
                  className="pl-7" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Wellness Rate (%)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                <Input 
                  value={rates.wellness} 
                  onChange={(e) => handleRateChange('wellness', e.target.value)}
                  className="pl-7" 
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Processing Fee (%)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              <Input 
                value={rates.processing} 
                onChange={(e) => handleRateChange('processing', e.target.value)}
                className="pl-7" 
              />
            </div>
          </div>
          <Button 
            onClick={handleUpdateRates} 
            className="w-full" 
            disabled={updateCommissionMutation.isPending}
          >
            {updateCommissionMutation.isPending ? 'Updating...' : 'Update Commission Rates'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Vendor Payout List component
const VendorPayoutList = ({ revenueData }: { revenueData: any }) => {
  const [selectedPayouts, setSelectedPayouts] = useState<number[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processPayoutsMutation = useMutation({
    mutationFn: async (vendorIds: number[]) => {
      const response = await apiRequest('POST', '/api/revenue/process-payouts', { vendorIds });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.message}`,
      });
      setSelectedPayouts([]);
      queryClient.invalidateQueries({ queryKey: ['/api/revenue/analytics'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payouts",
        variant: "destructive"
      });
    }
  });
  
  if (!revenueData) return <div>Loading...</div>;

  const { topVendors } = revenueData;
  const eligibleVendors = topVendors.filter((vendor: any) => vendor.revenue > 0);

  const toggleSelectAll = () => {
    if (selectedPayouts.length === eligibleVendors.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(eligibleVendors.map((v: any) => v.id));
    }
  };
  
  const toggleSelectVendor = (id: number) => {
    if (selectedPayouts.includes(id)) {
      setSelectedPayouts(selectedPayouts.filter(p => p !== id));
    } else {
      setSelectedPayouts([...selectedPayouts, id]);
    }
  };

  const handleProcessPayouts = () => {
    if (selectedPayouts.length === 0) return;
    processPayoutsMutation.mutate(selectedPayouts);
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-lg">Vendor Payouts</h3>
          <Button 
            disabled={selectedPayouts.length === 0 || processPayoutsMutation.isPending} 
            size="sm"
            onClick={handleProcessPayouts}
          >
            {processPayoutsMutation.isPending ? 'Processing...' : `Process Selected (${selectedPayouts.length})`}
          </Button>
        </div>
        
        <div className="border rounded-md">
          <div className="flex items-center p-4 border-b bg-slate-50">
            <div className="pr-4">
              <input 
                type="checkbox" 
                checked={selectedPayouts.length === eligibleVendors.length} 
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded"
              />
            </div>
            <div className="grid grid-cols-5 w-full text-sm font-medium">
              <div>Vendor</div>
              <div>Business Type</div>
              <div>Revenue</div>
              <div>Bookings</div>
              <div>Payout Amount</div>
            </div>
          </div>
          
          {eligibleVendors.map((vendor: any) => (
            <div key={vendor.id} className="flex items-center p-4 border-b last:border-0 hover:bg-slate-50">
              <div className="pr-4">
                <input 
                  type="checkbox" 
                  checked={selectedPayouts.includes(vendor.id)} 
                  onChange={() => toggleSelectVendor(vendor.id)}
                  className="h-4 w-4 rounded"
                />
              </div>
              <div className="grid grid-cols-5 w-full text-sm">
                <div className="font-medium">{vendor.name}</div>
                <div className="capitalize">{vendor.businessType}</div>
                <div>${vendor.revenue.toLocaleString()}</div>
                <div>{vendor.bookingCount}</div>
                <div className="font-medium text-green-600">
                  ${(vendor.revenue * 0.9).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const RevenueManagement = () => {
  const [timeframe, setTimeframe] = useState('thisMonth');
  
  const { toast } = useToast();

  const { data: revenueData, isLoading, error } = useQuery({
    queryKey: ['/api/revenue/analytics', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/revenue/analytics?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch revenue analytics');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleExportReport = async () => {
    try {
      const response = await fetch(`/api/revenue/export?format=csv&timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to export report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${timeframe}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Revenue report exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export revenue report",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading revenue data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading revenue data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Revenue Management</h1>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="lastQuarter">Last Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            Export Report
          </Button>
        </div>
      </div>
      
      <RevenueSummary revenueData={revenueData} />
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RevenueChart revenueData={revenueData} />
            <RevenueByCategory revenueData={revenueData} />
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RevenueByCategory revenueData={revenueData} />
            <RevenueChart revenueData={revenueData} />
          </div>
        </TabsContent>
        
        <TabsContent value="vendors" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TopEarningVendors revenueData={revenueData} />
            <VendorPayoutList revenueData={revenueData} />
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CommissionSettings />
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-4">Revenue Reports</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <path d="M9 9h6v6H9z"/>
                    </svg>
                    Monthly Revenue Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    Vendor Performance Analysis
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    Commission Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueManagement;