import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from '@shared/schema';

// Fetch vendors from database
const useVendors = () => {
  return useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const response = await fetch('/api/vendors', {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          // Auto-login as admin for testing
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: 'admin@islandloaf.com', password: 'admin123' }),
          });
          
          if (loginResponse.ok) {
            // Retry the original request
            const retryResponse = await fetch('/api/vendors', {
              credentials: 'include',
            });
            if (retryResponse.ok) {
              return retryResponse.json() as Promise<User[]>;
            }
          }
        }
        throw new Error('Failed to fetch vendors');
      }
      return response.json() as Promise<User[]>;
    },
  });
};

// Vendor Detail Dialog component
const VendorDetailDialog = ({ vendor, onVerify, onDeactivate, onEdit }: { vendor: User; onVerify: () => void; onDeactivate: () => void; onEdit: () => void }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">View details</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span>{vendor.businessName || vendor.fullName}</span>
            <Badge variant={vendor.role === 'vendor' ? 'default' : vendor.role === 'pending' ? 'secondary' : 'destructive'} className="ml-2">
              {vendor.role === 'vendor' ? 'Active' : vendor.role === 'pending' ? 'Pending' : 'Inactive'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>
              <div className="space-y-2 mt-2">
                <p><span className="font-medium">Email:</span> {vendor.email}</p>
                <p><span className="font-medium">Username:</span> {vendor.username}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Business Details</h4>
              <div className="space-y-2 mt-2">
                <p><span className="font-medium">Type:</span> {vendor.businessType || 'N/A'}</p>
                <p><span className="font-medium">Categories:</span> {(vendor.categoriesAllowed || []).join(', ') || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onEdit}>Edit</Button>
            <Button variant="outline" onClick={onVerify}>
              {vendor.role === 'vendor' ? 'Verified' : 'Verify'}
            </Button>
            <Button variant="destructive" onClick={onDeactivate}>
              {vendor.role === 'vendor' ? 'Deactivate' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function VendorManagement() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch vendors
  const { data: vendors = [], isLoading, error, refetch } = useVendors();
  
  // Local state for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<User | null>(null);

  // Delete vendor mutation
  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      const response = await apiRequest('DELETE', `/api/vendors/${vendorId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      refetch();
      toast({ title: "Vendor deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting vendor",
        description: error.message || "Failed to delete vendor",
        variant: "destructive"
      });
    }
  });

  // Update vendor mutation
  const updateVendorMutation = useMutation({
    mutationFn: async ({ vendorId, updates }: { vendorId: number; updates: any }) => {
      const response = await apiRequest('PUT', `/api/vendors/${vendorId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      refetch();
      toast({ title: "Vendor updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating vendor",
        description: error.message || "Failed to update vendor",
        variant: "destructive"
      });
    }
  });

  const deleteVendor = (vendorId: number) => {
    deleteVendorMutation.mutate(vendorId);
  };

  const updateVendorStatus = (vendorId: number, status: string) => {
    updateVendorMutation.mutate({ 
      vendorId, 
      updates: { role: status === 'verified' ? 'vendor' : 'pending' } 
    });
  };

  const toggleVendorActive = (vendorId: number, isActive: boolean) => {
    updateVendorMutation.mutate({ 
      vendorId, 
      updates: { role: isActive ? 'vendor' : 'inactive' } 
    });
  };
  
  // Filter vendors based on search query and filters
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      (vendor.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.id.toString().includes(searchQuery.toLowerCase());
    
    const matchesBusinessType = businessTypeFilter === 'all' || 
      (vendor.businessType || '').toLowerCase() === businessTypeFilter.toLowerCase();
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && vendor.role === 'vendor') ||
      (statusFilter === 'pending' && vendor.role === 'pending') ||
      (statusFilter === 'inactive' && vendor.role === 'inactive');
    
    return matchesSearch && matchesBusinessType && matchesStatus;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
        <Button onClick={() => setLocation('/admin/add-vendor')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Add New Vendor
        </Button>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <Input
                placeholder="Search vendors by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="tours">Tours</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {(vendor.businessName || vendor.fullName || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {vendor.businessName || vendor.fullName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {vendor.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{vendor.email}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">@{vendor.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {vendor.businessType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={vendor.role === 'vendor' ? 'default' : vendor.role === 'pending' ? 'secondary' : 'destructive'}>
                          {vendor.role === 'vendor' ? 'Active' : vendor.role === 'pending' ? 'Pending' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {(vendor.categoriesAllowed || []).join(', ') || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <VendorDetailDialog 
                            vendor={vendor}
                            onVerify={() => updateVendorStatus(vendor.id, 'verified')}
                            onDeactivate={() => deleteVendor(vendor.id)}
                            onEdit={() => {
                              setEditingVendor(vendor);
                              setIsEditVendorOpen(true);
                            }}
                          />
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingVendor(vendor);
                              setIsEditVendorOpen(true);
                            }}
                          >
                            <span className="sr-only">Edit</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => deleteVendor(vendor.id)}
                          >
                            <span className="sr-only">Delete</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredVendors.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        No vendors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-4 px-6 pb-4">
            <div className="text-sm text-muted-foreground">Showing {filteredVendors.length} of {vendors.length} vendors</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          {editingVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input 
                    value={editingVendor.businessName || ''}
                    onChange={(e) => setEditingVendor({...editingVendor, businessName: e.target.value})}
                    placeholder="Paradise Beach Resort"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Owner Name</Label>
                  <Input 
                    value={editingVendor.fullName || ''}
                    onChange={(e) => setEditingVendor({...editingVendor, fullName: e.target.value})}
                    placeholder="John Smith"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={editingVendor.email || ''}
                    onChange={(e) => setEditingVendor({...editingVendor, email: e.target.value})}
                    placeholder="john@resort.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input 
                    value={editingVendor.username || ''}
                    onChange={(e) => setEditingVendor({...editingVendor, username: e.target.value})}
                    placeholder="john_resort"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Select value={editingVendor.businessType} onValueChange={(value) => setEditingVendor({...editingVendor, businessType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accommodation">Accommodation</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="tours">Tours & Activities</SelectItem>
                      <SelectItem value="wellness">Wellness</SelectItem>
                      <SelectItem value="dining">Dining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editingVendor.role} onValueChange={(value) => setEditingVendor({...editingVendor, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditVendorOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  updateVendorMutation.mutate({ 
                    vendorId: editingVendor.id, 
                    updates: {
                      businessName: editingVendor.businessName,
                      fullName: editingVendor.fullName,
                      email: editingVendor.email,
                      username: editingVendor.username,
                      businessType: editingVendor.businessType,
                      role: editingVendor.role
                    }
                  });
                  setIsEditVendorOpen(false);
                }} disabled={updateVendorMutation.isPending}>
                  {updateVendorMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VendorManagement;