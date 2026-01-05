import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useApiQuery } from "@/lib/api-hooks";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import UpcomingBookings from "@/components/dashboard/upcoming-bookings";
import { bookingStatuses, type BookingStatus } from "@shared/schema";
import { fetchBookings } from "@/lib/api";
import type { ApiBooking as Booking } from "@shared/types/bookings";

const BookingManager = () => {
  const [_, setLocation] = useLocation();
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch real bookings data
  const { data: bookings = [], isLoading, refetch } = useApiQuery({
    key: ["/api/bookings"] as const,
    fn: async () => fetchBookings(),
  });

  const isBookingStatus = (v: string): v is BookingStatus => bookingStatuses.some((s) => s === v);

  // Handle booking category selection
  const handleCategorySelect = (category: string) => {
    setShowCategorySelector(false);
    setLocation(`/dashboard/add-booking`);
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter((booking: Booking) => {
    const matchesSearch = !searchQuery || 
      booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toString().includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Debug: Log bookings data 
  console.log('Total bookings:', bookings.length);
  console.log('Filtered bookings:', filteredBookings.length);
  console.log('Search query:', searchQuery);
  console.log('Status filter:', statusFilter);
  console.log('Bookings data:', bookings);

  // Get bookings by status
  const getBookingsByStatus = (status: BookingStatus | "upcoming") => {
    if (status === 'upcoming') {
      return filteredBookings.filter(booking => 
        booking.status === 'confirmed' && new Date(booking.startDate) > new Date()
      );
    }
    return filteredBookings.filter(booking => booking.status === status);
  };

  // Status badge styling
  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
    };
    return variants[status];
  };

  // BookingTable component for displaying bookings in a table format
  const BookingTable = ({ bookings }: { bookings: Booking[] }) => {
    if (bookings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-gray-100 p-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <path d="M8 2v4"></path>
              <path d="M16 2v4"></path>
              <path d="M21 12H3"></path>
              <path d="M21 6H3"></path>
              <path d="M21 18H3"></path>
              <path d="M3 2v20"></path>
              <path d="M21 2v20"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-1">No bookings found</h3>
          <p className="text-muted-foreground">There are no bookings in this category yet.</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">#{booking.id}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{booking.customerName}</div>
                  <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadge(booking.status)}>
                  {booking.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">${booking.totalPrice}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('View button clicked for booking:', booking.id);
                      setSelectedBooking(booking);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Edit button clicked for booking:', booking.id);
                      alert(`Edit booking #${booking.id} functionality coming soon!`);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Booking Manager</h1>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button 
            variant="default" 
            onClick={() => setShowCategorySelector(true)}
            className="w-full sm:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Booking
          </Button>
          
          {/* Booking Category Selection Modal */}
          <Dialog open={showCategorySelector} onOpenChange={setShowCategorySelector}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select Booking Category</DialogTitle>
                <DialogDescription>
                  Choose the type of booking you'd like to create
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {[
                  { id: 'stay', name: 'Stay', icon: '🏠', desc: 'Accommodations and lodging' },
                  { id: 'transport', name: 'Transport', icon: '🚗', desc: 'Vehicle rentals and transfers' },
                  { id: 'wellness', name: 'Health & Wellness', icon: '💆', desc: 'Spa, yoga, and wellness services' },
                  { id: 'tour', name: 'Tours', icon: '🧭', desc: 'Guided tours and experiences' },
                  { id: 'product', name: 'Products', icon: '🛍️', desc: 'Physical goods and merchandise' }
                ].map(category => (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center text-center"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <span className="text-2xl mb-2">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{category.desc}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <div className="relative w-full sm:w-[300px]">
            <Input 
              type="text"
              placeholder="Search by name or booking ID..." 
              className="w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </div>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(isBookingStatus(v) ? v : "all")}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <BookingTable bookings={filteredBookings} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <BookingTable bookings={getBookingsByStatus('upcoming')} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <BookingTable bookings={getBookingsByStatus('pending')} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <BookingTable bookings={getBookingsByStatus('completed')} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cancelled" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <BookingTable bookings={getBookingsByStatus('cancelled')} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-medium">#{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusBadge(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Email</p>
                  <p className="font-medium">{selectedBooking.customerEmail}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(selectedBooking.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{new Date(selectedBooking.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="font-medium">${selectedBooking.totalPrice}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commission</p>
                  <p className="font-medium">${selectedBooking.commission}</p>
                </div>
              </div>
              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{selectedBooking.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  alert(`Edit booking #${selectedBooking.id} functionality coming soon!`);
                }}>
                  Edit Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingManager;