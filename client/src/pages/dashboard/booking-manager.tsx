import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { format, addDays } from "date-fns";
import { Search, Calendar, Filter, Edit, Eye, CalendarIcon, Plus, CalendarCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useApiQuery } from "@/lib/api-hooks";
import { apiRequest } from "@/lib/queryClient";
import { fetchBookings } from "@/lib/api";
import { bookingStatuses, type BookingStatus } from "@shared/schema";
import type { ApiBooking as Booking } from "@shared/types/bookings";

export default function BookingManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingTab, setBookingTab] = useState("upcoming");
  const [_, setLocation] = useLocation();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [priceRangeMin, setPriceRangeMin] = useState("");
  const [priceRangeMax, setPriceRangeMax] = useState("");
  
  // Edit form states
  const [editStatus, setEditStatus] = useState<BookingStatus | undefined>(undefined);
  const [editNotes, setEditNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: bookings, isLoading, error, refetch } = useApiQuery({
    key: ["/api/bookings"] as const,
    fn: async () => fetchBookings(),
  });

  const isBookingStatus = (v: string): v is BookingStatus => bookingStatuses.some((s) => s === v);
  
  // Mutation for updating bookings
  const updateBookingMutation = useMutation({
    mutationFn: async (data: { id: number; status?: BookingStatus; notes?: string }) => {
      // Preserve existing API behavior: PATCH /api/bookings/:id with {status, notes}
      const res = await apiRequest("PATCH", `/api/bookings/${data.id}`, {
        status: data.status,
        notes: data.notes,
      });
      const json: unknown = await res.json();
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: "Booking updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking",
        variant: "destructive",
      });
    },
  });
  
  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const formatDate = (value: string | Date) => {
    return format(new Date(value), "MMM d, yyyy");
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Use real bookings data from API
  const realBookings = bookings ?? [];
  
  // Enhanced filtering logic
  const filteredBookings = realBookings.filter((booking: Booking) => {
    // Search filter
    const matchesSearch = !searchQuery || 
      booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toString().includes(searchQuery);
    
    // Status filter
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    // Date range filter
    const bookingDate = new Date(booking.startDate);
    const matchesDateRange = (!dateFrom || bookingDate >= dateFrom) && 
                            (!dateTo || bookingDate <= dateTo);
    
    // Price range filter
    const matchesPriceRange =
      (!priceRangeMin || booking.totalPrice >= parseInt(priceRangeMin)) &&
      (!priceRangeMax || booking.totalPrice <= parseInt(priceRangeMax));
    
    // Tab-based filtering
    let matchesTab = true;
    if (bookingTab === "upcoming") {
      matchesTab = booking.status !== "completed" && booking.status !== "cancelled";
    } else if (bookingTab === "past") {
      matchesTab = booking.status === "completed" || booking.status === "cancelled";
    }
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesPriceRange && matchesTab;
  });
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Booking Manager"
          description="Manage all your bookings in one place"
        />
        <TableSkeleton rows={8} />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Booking Manager"
          description="Manage all your bookings in one place"
        />
        <ErrorState 
          message={error instanceof Error ? error.message : "Failed to load bookings"}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Booking Manager"
        description="View, search, and manage all your bookings"
        action={{
          label: "New Booking",
          onClick: () => setLocation("/dashboard/add-booking"),
          icon: <Plus className="h-4 w-4" />,
        }}
      />
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search bookings by name, email, or service..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Popover open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsDateRangeOpen(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Date Range
                    {(dateFrom || dateTo) && (
                      <Badge variant="secondary" className="ml-2">
                        {dateFrom && dateTo ? '2' : '1'}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>From Date</Label>
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>To Date</Label>
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setDateFrom(undefined);
                          setDateTo(undefined);
                        }}
                      >
                        Clear
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setIsDateRangeOpen(false)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsFilterDialogOpen(true)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {(statusFilter !== "all" || priceRangeMin || priceRangeMax) && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setLocation("/dashboard/add-booking")}
              >
                + New Booking
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="upcoming" onValueChange={setBookingTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming">Upcoming & Active</TabsTrigger>
              <TabsTrigger value="past">Past Bookings</TabsTrigger>
              <TabsTrigger value="all">All Bookings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="m-0">
              <BookingTable 
                bookings={filteredBookings} 
                onViewBooking={(booking) => {
                  setSelectedBooking(booking);
                  setIsViewDialogOpen(true);
                }}
                onEditBooking={(booking) => {
                  setSelectedBooking(booking);
                  setEditStatus(booking.status);
                  setEditNotes(booking.notes || "");
                  setIsEditDialogOpen(true);
                }}
              />
            </TabsContent>
            
            <TabsContent value="past" className="m-0">
              <BookingTable 
                bookings={filteredBookings} 
                onViewBooking={(booking) => {
                  setSelectedBooking(booking);
                  setIsViewDialogOpen(true);
                }}
                onEditBooking={(booking) => {
                  setSelectedBooking(booking);
                  setEditStatus(booking.status);
                  setEditNotes(booking.notes || "");
                  setIsEditDialogOpen(true);
                }}
              />
            </TabsContent>
            
            <TabsContent value="all" className="m-0">
              <BookingTable 
                bookings={filteredBookings} 
                onViewBooking={(booking) => {
                  setSelectedBooking(booking);
                  setIsViewDialogOpen(true);
                }}
                onEditBooking={(booking) => {
                  setSelectedBooking(booking);
                  setEditStatus(booking.status);
                  setEditNotes(booking.notes || "");
                  setIsEditDialogOpen(true);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View complete booking information
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Booking ID</Label>
                  <p className="text-lg font-semibold">#{selectedBooking.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant="outline" className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer Name</Label>
                  <p className="text-lg">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-lg">{selectedBooking.customerEmail}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                  <p className="text-lg">{formatDate(selectedBooking.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">End Date</Label>
                  <p className="text-lg">{formatDate(selectedBooking.endDate)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total Price</Label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedBooking.totalPrice)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Commission</Label>
                  <p className="text-lg">{formatCurrency(selectedBooking.commission)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Service</Label>
                <p className="text-lg">{selectedBooking.serviceName || `Service #${selectedBooking.serviceId}`}</p>
              </div>
              
              {selectedBooking.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-lg">{selectedBooking.notes}</p>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                <p>
                  Created:{" "}
                  {selectedBooking.createdAt
                    ? format(new Date(selectedBooking.createdAt), "MMM d, yyyy 'at' h:mm a")
                    : "N/A"}
                </p>
                <p>
                  Updated:{" "}
                  {selectedBooking.updatedAt
                    ? format(new Date(selectedBooking.updatedAt), "MMM d, yyyy 'at' h:mm a")
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>
              Update booking status and notes
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Booking ID</Label>
                  <p className="text-lg font-semibold">#{selectedBooking.id}</p>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p className="text-lg">{selectedBooking.customerName}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editStatus ?? ""}
                  onValueChange={(v) => setEditStatus(isBookingStatus(v) ? v : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this booking..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedBooking) {
                  updateBookingMutation.mutate({
                    id: selectedBooking.id,
                    status: editStatus,
                    notes: editNotes,
                  });
                }
              }}
              disabled={updateBookingMutation.isPending}
            >
              {updateBookingMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Filter bookings by status, price range, and more
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(isBookingStatus(v) ? v : "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min price"
                  value={priceRangeMin}
                  onChange={(e) => setPriceRangeMin(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max price"
                  value={priceRangeMax}
                  onChange={(e) => setPriceRangeMax(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("all");
                setPriceRangeMin("");
                setPriceRangeMax("");
              }}
            >
              Clear All
            </Button>
            <Button
              onClick={() => setIsFilterDialogOpen(false)}
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BookingTableProps {
  bookings: any[];
  onViewBooking: (booking: any) => void;
  onEditBooking: (booking: any) => void;
}

function BookingTable({ bookings, onViewBooking, onEditBooking }: BookingTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No bookings found
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">#{booking.id}</TableCell>
                <TableCell>{booking.serviceName || `Service #${booking.serviceId}`}</TableCell>
                <TableCell>
                  <div>{booking.customerName}</div>
                  <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                </TableCell>
                <TableCell>
                  {formatDate(booking.startDate)} 
                  {booking.startDate !== booking.endDate && ` - ${formatDate(booking.endDate)}`}
                </TableCell>
                <TableCell>{formatCurrency(booking.totalPrice)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('View booking clicked:', booking.id);
                        onViewBooking(booking);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Edit booking clicked:', booking.id);
                        onEditBooking(booking);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
