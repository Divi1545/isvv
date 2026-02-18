import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import RoomManagementForm from "@/components/forms/RoomManagementForm";

const AddVendorForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    businessName: '',
    email: '',
    businessType: '',
    categories: {
      stay: false,
      vehicle: false,
      tickets: false,
      wellness: false,
      tours: false,
      products: false
    }
  });

  const [roomData, setRoomData] = useState(null);
  const [showRoomManagement, setShowRoomManagement] = useState(false);
  
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const createVendorMutation = useMutation({
    mutationFn: async (vendorData: any) => {
      const response = await apiRequest('POST', '/api/vendors', vendorData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vendor created successfully",
        description: `${data.fullName} has been added to the platform`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      setLocation('/admin/vendors');
    },
    onError: (error: any) => {
      toast({
        title: "Error creating vendor",
        description: error.message || "Failed to create vendor",
        variant: "destructive"
      });
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Show room management if business type is accommodation (stays, hotel, accommodation)
    if (name === 'businessType' && (value === 'stays' || value === 'hotel' || value === 'accommodation')) {
      setShowRoomManagement(true);
    } else if (name === 'businessType') {
      setShowRoomManagement(false);
      setRoomData(null);
    }
  };
  
  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: checked
      }
    }));
  };
  
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate required fields
    if (!formData.username || !formData.password || !formData.fullName || !formData.businessName || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Convert categories to array format
    const categoriesAllowed = Object.keys(formData.categories).filter(
      key => formData.categories[key as keyof typeof formData.categories]
    );
    
    const vendorData = {
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName,
      businessName: formData.businessName,
      email: formData.email,
      businessType: formData.businessType,
      categoriesAllowed,
      roomData: showRoomManagement && roomData?.roomTypes?.[0] ? {
        name: roomData.roomTypes[0].roomTypeName,
        bedType: roomData.roomTypes[0].bedTypes[0] || 'single',
        maxOccupancy: roomData.roomTypes[0].numberOfRooms,
        amenities: roomData.roomTypes[0].amenities,
        basePrice: 100,
        description: roomData.roomTypes[0].description || 'Standard room'
      } : null
    };
    
    console.log("Submitting vendor data:", vendorData);
    createVendorMutation.mutate(vendorData);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-4 p-0 h-auto" 
          onClick={() => window.location.href = "/dashboard"}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add New Vendor</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter business name"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="businessType">Business Type</Label>
                <Select 
                  value={formData.businessType}
                  onValueChange={(value) => handleSelectChange('businessType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stays">Hotel / Resort / Villa</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="vehicles">Transport Company</SelectItem>
                    <SelectItem value="tours">Tour Operator</SelectItem>
                    <SelectItem value="wellness">Wellness Center</SelectItem>
                    <SelectItem value="tickets">Tickets & Events</SelectItem>
                    <SelectItem value="products">Products & Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Booking Categories Access</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="stay"
                    checked={formData.categories.stay}
                    onCheckedChange={(checked) => 
                      handleCategoryChange('stay', checked as boolean)
                    }
                  />
                  <label
                    htmlFor="stay"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Stay
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="vehicle"
                    checked={formData.categories.vehicle}
                    onCheckedChange={(checked) => 
                      handleCategoryChange('vehicle', checked as boolean)
                    }
                  />
                  <label
                    htmlFor="vehicle"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Vehicle
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tickets"
                    checked={formData.categories.tickets}
                    onCheckedChange={(checked) => 
                      handleCategoryChange('tickets', checked as boolean)
                    }
                  />
                  <label
                    htmlFor="tickets"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Tickets
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="wellness"
                    checked={formData.categories.wellness}
                    onCheckedChange={(checked) => 
                      handleCategoryChange('wellness', checked as boolean)
                    }
                  />
                  <label
                    htmlFor="wellness"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Wellness
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tours"
                    checked={formData.categories.tours}
                    onCheckedChange={(checked) => 
                      handleCategoryChange('tours', checked as boolean)
                    }
                  />
                  <label
                    htmlFor="tours"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Tours
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="products"
                    checked={formData.categories.products}
                    onCheckedChange={(checked) => 
                      handleCategoryChange('products', checked as boolean)
                    }
                  />
                  <label
                    htmlFor="products"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Products
                  </label>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Room Management Section for Accommodation Types */}
      {showRoomManagement && (
        <Card>
          <CardHeader>
            <CardTitle>Room Types & Amenities</CardTitle>
            <p className="text-sm text-gray-600">
              Configure room types, bed options, and amenities for your accommodation business.
            </p>
          </CardHeader>
          <CardContent>
            <RoomManagementForm
              onSave={(data) => setRoomData(data)}
              onCancel={() => {
                setShowRoomManagement(false);
                setRoomData(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/admin/vendors")}
              disabled={createVendorMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createVendorMutation.isPending || (showRoomManagement && !roomData)}
            >
              {createVendorMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Vendor"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddVendorForm;