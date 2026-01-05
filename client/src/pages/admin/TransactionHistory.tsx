import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';

interface Transaction {
  id: number;
  bookingId: number;
  vendorId: number;
  vendorName: string;
  amount: number;
  commission: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: number;
    customerName: string;
    customerEmail: string;
    serviceType: string;
    totalPrice: number;
  };
}

interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  totalCommission: number;
  pendingAmount: number;
  completedAmount: number;
  failedAmount: number;
  refundedAmount: number;
}

const TransactionHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bookings as transaction data
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    }
  });

  // Fetch vendors for transaction mapping
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const response = await fetch('/api/vendors');
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return response.json();
    }
  });

  // Fetch revenue analytics for additional transaction data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['/api/revenue/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/revenue/analytics');
      if (!response.ok) throw new Error('Failed to fetch revenue analytics');
      return response.json();
    }
  });

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      const response = await fetch('/api/revenue/process-payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ vendorIds: [vendorId] })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payout');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payout processed",
        description: data.message || "The payout has been processed successfully"
      });
      refetchBookings();
      queryClient.invalidateQueries({ queryKey: ['/api/revenue/analytics'] });
    },
    onError: (error) => {
      console.error('Payout processing error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payout. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Transform bookings into transaction format
  const transformedTransactions: Transaction[] = React.useMemo(() => {
    if (!bookings || !vendors) return [];
    
    return bookings.map((booking: any) => {
      const vendor = vendors.find((v: any) => v.id === booking.userId);
      return {
        id: booking.id,
        bookingId: booking.id,
        vendorId: booking.userId,
        vendorName: vendor?.businessName || vendor?.fullName || 'Unknown Vendor',
        amount: booking.totalPrice,
        commission: booking.commission || (booking.totalPrice * 0.1),
        status: booking.status === 'completed' ? 'completed' : 
                booking.status === 'cancelled' ? 'failed' : 
                booking.status === 'refunded' ? 'refunded' : 'pending',
        paymentMethod: 'Direct Deposit',
        date: booking.createdAt,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt || booking.createdAt,
        booking: {
          id: booking.id,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          serviceType: booking.serviceType || 'Service',
          totalPrice: booking.totalPrice
        }
      };
    });
  }, [bookings, vendors]);

  // Filter transactions
  const filteredTransactions = React.useMemo(() => {
    if (!transformedTransactions) return [];
    
    return transformedTransactions.filter(transaction => {
      const matchesSearch = 
        transaction.id.toString().includes(searchQuery) ||
        transaction.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.booking?.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.booking?.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      
      // Date filtering
      const matchesDate = (() => {
        if (dateRangeFilter === 'all') {
          return true;
        }
        
        const transactionDate = new Date(transaction.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day
        
        switch (dateRangeFilter) {
          case 'today':
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);
            return transactionDate >= today && transactionDate <= todayEnd;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return transactionDate >= weekAgo && transactionDate <= new Date();
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return transactionDate >= monthAgo && transactionDate <= new Date();
          case 'quarter':
            const quarterAgo = new Date(today);
            quarterAgo.setMonth(today.getMonth() - 3);
            return transactionDate >= quarterAgo && transactionDate <= new Date();
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [transformedTransactions, searchQuery, statusFilter, dateRangeFilter]);

  // Calculate transaction statistics
  const transactionStats: TransactionStats = React.useMemo(() => {
    if (!filteredTransactions) return {
      totalTransactions: 0,
      totalAmount: 0,
      totalCommission: 0,
      pendingAmount: 0,
      completedAmount: 0,
      failedAmount: 0,
      refundedAmount: 0
    };

    return filteredTransactions.reduce((stats, transaction) => {
      stats.totalTransactions++;
      stats.totalAmount += transaction.amount;
      stats.totalCommission += transaction.commission;
      
      switch (transaction.status) {
        case 'pending':
          stats.pendingAmount += transaction.amount;
          break;
        case 'completed':
          stats.completedAmount += transaction.amount;
          break;
        case 'failed':
          stats.failedAmount += transaction.amount;
          break;
        case 'refunded':
          stats.refundedAmount += transaction.amount;
          break;
      }
      
      return stats;
    }, {
      totalTransactions: 0,
      totalAmount: 0,
      totalCommission: 0,
      pendingAmount: 0,
      completedAmount: 0,
      failedAmount: 0,
      refundedAmount: 0
    });
  }, [filteredTransactions]);

  // Handle refresh
  const handleRefresh = () => {
    refetchBookings();
    queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
    queryClient.invalidateQueries({ queryKey: ['/api/revenue/analytics'] });
  };

  // Export transactions to CSV
  const handleExportCSV = () => {
    const csvData = [
      ['Transaction ID', 'Vendor', 'Customer', 'Amount', 'Commission', 'Status', 'Date', 'Payment Method'],
      ...filteredTransactions.map(transaction => [
        transaction.id,
        transaction.vendorName,
        transaction.booking?.customerName || 'N/A',
        transaction.amount,
        transaction.commission,
        transaction.status,
        new Date(transaction.date).toLocaleDateString(),
        transaction.paymentMethod
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Transaction data has been exported successfully"
    });
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleProcessPayout = (vendorId: number) => {
    processPayoutMutation.mutate(vendorId);
  };

  const isLoading = bookingsLoading || vendorsLoading || revenueLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transaction data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">
            Manage all platform transactions and payouts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactionStats.totalTransactions}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${transactionStats.totalAmount.toFixed(2)}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold">${transactionStats.totalCommission.toFixed(2)}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Download className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold">${transactionStats.pendingAmount.toFixed(2)}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID, vendor, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Transaction ID</th>
                  <th className="text-left p-3">Vendor</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-right p-3">Commission</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">TRX-{transaction.id}</td>
                    <td className="p-3">{transaction.vendorName}</td>
                    <td className="p-3">{transaction.booking?.customerName || 'N/A'}</td>
                    <td className="p-3 text-right font-semibold">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      ${transaction.commission.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge 
                        variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' :
                          transaction.status === 'failed' ? 'destructive' :
                          'outline'
                        }
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {transaction.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcessPayout(transaction.vendorId)}
                            disabled={processPayoutMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <XCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              View comprehensive transaction information including booking details and payment information.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="booking">Booking Info</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Transaction ID</label>
                      <p className="text-sm text-muted-foreground">TRX-{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <div className="mt-1">
                        <Badge 
                          variant={
                            selectedTransaction.status === 'completed' ? 'default' :
                            selectedTransaction.status === 'pending' ? 'secondary' :
                            selectedTransaction.status === 'failed' ? 'destructive' :
                            'outline'
                          }
                        >
                          {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <p className="text-lg font-semibold">${selectedTransaction.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Commission</label>
                      <p className="text-lg font-semibold">${selectedTransaction.commission.toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vendor</label>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.vendorName}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="booking" className="space-y-4">
                {selectedTransaction.booking && (
                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium">Customer Name</label>
                      <p className="text-sm text-muted-foreground">{selectedTransaction.booking.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Customer Email</label>
                      <p className="text-sm text-muted-foreground">{selectedTransaction.booking.customerEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Service Type</label>
                      <p className="text-sm text-muted-foreground">{selectedTransaction.booking.serviceType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Booking Total</label>
                      <p className="text-lg font-semibold">${selectedTransaction.booking.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="payment" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium">Payment Method</label>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Transaction Date</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTransaction.date).toLocaleDateString()} at {new Date(selectedTransaction.date).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTransaction.updatedAt).toLocaleDateString()} at {new Date(selectedTransaction.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHistory;