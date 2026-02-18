import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, Calendar, MapPin, User, Mail, Phone, Edit, Trash2, Eye } from 'lucide-react';
import { bookingStatuses } from "@shared/schema";

type BookingStatus = (typeof bookingStatuses)[number];
const bookingStatusSet: ReadonlySet<string> = new Set(bookingStatuses);

function isBookingStatus(v: unknown): v is BookingStatus {
  return typeof v === "string" && bookingStatusSet.has(v);
}

interface Booking {
  id: number;
  userId: number;
  serviceId: number;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalPrice: number;
  commission: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vendorName?: string;
  vendorType?: string;
}

const BookingManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bookings
  const { data: bookings = [], isLoading, error } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    refetchInterval: 30000,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: Partial<Booking>) => {
      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Booking> }) => {
      const response = await apiRequest('PUT', `/api/bookings/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: "Booking updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking",
        variant: "destructive",
      });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/bookings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: BookingStatus }) => {
      const response = await apiRequest('PATCH', `/api/bookings/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (booking.vendorName && booking.vendorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const statusRaw = formData.get("status");
    if (!isBookingStatus(statusRaw)) {
      toast({
        title: "Invalid status",
        description: "Please select a valid booking status.",
        variant: "destructive",
      });
      return;
    }
    const bookingData = {
      customerName: formData.get('customerName') as string,
      customerEmail: formData.get('customerEmail') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      totalPrice: parseFloat(formData.get('totalPrice') as string),
      commission: parseFloat(formData.get('commission') as string),
      status: statusRaw,
      notes: formData.get('notes') as string,
    };
    createBookingMutation.mutate(bookingData);
  };

  const handleUpdateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const statusRaw = formData.get("status");
    if (!isBookingStatus(statusRaw)) {
      toast({
        title: "Invalid status",
        description: "Please select a valid booking status.",
        variant: "destructive",
      });
      return;
    }
    const bookingData = {
      customerName: formData.get('customerName') as string,
      customerEmail: formData.get('customerEmail') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      totalPrice: parseFloat(formData.get('totalPrice') as string),
      commission: parseFloat(formData.get('commission') as string),
      status: statusRaw,
      notes: formData.get('notes') as string,
    };
    updateBookingMutation.mutate({ id: selectedBooking.id, data: bookingData });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input id="customerName" name="customerName" required />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input id="customerEmail" name="customerEmail" type="email" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="datetime-local" required />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="datetime-local" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPrice">Total Price</Label>
                  <Input id="totalPrice" name="totalPrice" type="number" step="0.01" required />
                </div>
                <div>
                  <Label htmlFor="commission">Commission</Label>
                  <Input id="commission" name="commission" type="number" step="0.01" />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="pending">
                  <SelectTrigger>
                    <SelectValue />
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
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBookingMutation.isPending}>
                  {createBookingMutation.isPending ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, email, or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
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
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Vendor</th>
                    <th className="text-left p-3">Dates</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{booking.customerName}</div>
                          <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{booking.vendorName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{booking.vendorType || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>Start: {formatDate(booking.startDate)}</div>
                          <div>End: {formatDate(booking.endDate)}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusBadge(booking.status)}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{formatCurrency(booking.totalPrice)}</div>
                          <div className="text-sm text-gray-500">
                            Commission: {formatCurrency(booking.commission)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this booking?')) {
                                deleteBookingMutation.mutate(booking.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <Label>Customer Name</Label>
                  <p className="font-medium">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <Label>Customer Email</Label>
                  <p className="font-medium">{selectedBooking.customerEmail}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor</Label>
                  <p className="font-medium">{selectedBooking.vendorName || 'N/A'}</p>
                </div>
                <div>
                  <Label>Business Type</Label>
                  <p className="font-medium">{selectedBooking.vendorType || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <p className="font-medium">{formatDate(selectedBooking.startDate)}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="font-medium">{formatDate(selectedBooking.endDate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Price</Label>
                  <p className="font-medium">{formatCurrency(selectedBooking.totalPrice)}</p>
                </div>
                <div>
                  <Label>Commission</Label>
                  <p className="font-medium">{formatCurrency(selectedBooking.commission)}</p>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusBadge(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                  <Select 
                    value={selectedBooking.status} 
                    onValueChange={(status) => {
                      if (isBookingStatus(status)) {
                        updateStatusMutation.mutate({ id: selectedBooking.id, status });
                      }
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
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
              </div>
              {selectedBooking.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="font-medium">{selectedBooking.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created At</Label>
                  <p className="font-medium">{formatDate(selectedBooking.createdAt)}</p>
                </div>
                <div>
                  <Label>Updated At</Label>
                  <p className="font-medium">{formatDate(selectedBooking.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <form onSubmit={handleUpdateBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-customerName">Customer Name</Label>
                  <Input 
                    id="edit-customerName" 
                    name="customerName" 
                    defaultValue={selectedBooking.customerName}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-customerEmail">Customer Email</Label>
                  <Input 
                    id="edit-customerEmail" 
                    name="customerEmail" 
                    type="email" 
                    defaultValue={selectedBooking.customerEmail}
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input 
                    id="edit-startDate" 
                    name="startDate" 
                    type="datetime-local" 
                    defaultValue={new Date(selectedBooking.startDate).toISOString().slice(0, 16)}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input 
                    id="edit-endDate" 
                    name="endDate" 
                    type="datetime-local" 
                    defaultValue={new Date(selectedBooking.endDate).toISOString().slice(0, 16)}
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-totalPrice">Total Price</Label>
                  <Input 
                    id="edit-totalPrice" 
                    name="totalPrice" 
                    type="number" 
                    step="0.01" 
                    defaultValue={selectedBooking.totalPrice}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-commission">Commission</Label>
                  <Input 
                    id="edit-commission" 
                    name="commission" 
                    type="number" 
                    step="0.01" 
                    defaultValue={selectedBooking.commission}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={selectedBooking.status}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea 
                  id="edit-notes" 
                  name="notes" 
                  rows={3} 
                  defaultValue={selectedBooking.notes || ''}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateBookingMutation.isPending}>
                  {updateBookingMutation.isPending ? 'Updating...' : 'Update Booking'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingManagement;