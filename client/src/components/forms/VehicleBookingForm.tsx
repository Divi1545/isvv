import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";

interface VehicleBookingFormProps {
  onSuccess: () => void;
}

const VehicleBookingForm = ({ onSuccess }: VehicleBookingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    vehicleType: '',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    pickupLocation: '',
    dropoffLocation: '',
    withDriver: true,
    pickupDate: '2025-05-21',
    dropoffDate: '2025-05-24',
    pricePerDay: '8000',
    taxPercent: '8',
    extraKMCharge: '50',
    discounts: {
      longRental: '1000'
    },
    notes: '',
    status: 'pending'
  });

  type FormDataKey = keyof typeof formData;
  type NestedKey = 'discounts';

  const handleChange = (field: FormDataKey, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
    // Clear any error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };
  
  const handleNestedChange = (parent: NestedKey, field: string, value: any) => {
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value
      }
    });
    // Clear any error for this nested field
    const errorKey = `${parent}.${field}`;
    if (errors[errorKey]) {
      setErrors({
        ...errors,
        [errorKey]: ''
      });
    }
  };

  const calculateTotal = () => {
    const pricePerDay = parseInt(formData.pricePerDay) || 0;
    const taxPercent = parseInt(formData.taxPercent) || 0;
    const longRentalDiscount = parseInt(formData.discounts.longRental) || 0;
    
    // Calculate days (sample calculation)
    const pickup = new Date(formData.pickupDate);
    const dropoff = new Date(formData.dropoffDate);
    const days = Math.max(1, Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 3600 * 24)));
    
    const subtotal = pricePerDay * days;
    const taxAmount = (subtotal * taxPercent) / 100;
    
    // Apply discount only for rentals of 3+ days
    const discountAmount = days >= 3 ? longRentalDiscount : 0;
    
    const total = subtotal + taxAmount - discountAmount;
    
    return total.toLocaleString();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.vehicleType) newErrors.vehicleType = "Vehicle type is required";
    if (!formData.pickupLocation) newErrors.pickupLocation = "Pickup location is required";
    if (!formData.dropoffLocation) newErrors.dropoffLocation = "Drop-off location is required";
    
    // Date validation
    const pickup = new Date(formData.pickupDate);
    const dropoff = new Date(formData.dropoffDate);
    
    if (dropoff <= pickup) {
      newErrors.dropoffDate = "Drop-off date must be after pickup date";
    }
    
    // Price validation
    if (!formData.pricePerDay || parseFloat(formData.pricePerDay) <= 0) {
      newErrors.pricePerDay = "Price per day must be greater than zero";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Form Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate total price for submission
      const totalPrice = parseInt(calculateTotal().replace(/,/g, ''));
      
      // Prepare booking data
      const bookingData = {
        type: 'vehicle',
        details: {
          ...formData,
          totalPrice
        },
        userId: 1, // This would come from auth context in a real app
        status: formData.status
      };
      
      // API submission
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create booking');
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      toast({
        title: "Success!",
        description: "Vehicle booking has been created successfully",
        variant: "default"
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {Object.keys(errors).length > 0 && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertDescription>
            Please fix the validation errors before submitting.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Select 
              value={formData.vehicleType} 
              onValueChange={(value) => handleChange('vehicleType', value)}
            >
              <SelectTrigger className={errors.vehicleType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="tuktuk">Tuk Tuk</SelectItem>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                <SelectItem value="scooter">Scooter</SelectItem>
                <SelectItem value="boat">Boat</SelectItem>
              </SelectContent>
            </Select>
            {errors.vehicleType && <p className="text-red-500 text-sm mt-1">{errors.vehicleType}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transmission">Transmission</Label>
              <Select 
                value={formData.transmission} 
                onValueChange={(value) => handleChange('transmission', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select 
                value={formData.fuelType} 
                onValueChange={(value) => handleChange('fuelType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="pickupLocation">Pickup Location</Label>
            <Input 
              id="pickupLocation" 
              value={formData.pickupLocation} 
              onChange={(e) => handleChange('pickupLocation', e.target.value)}
              placeholder="e.g. Colombo"
              className={errors.pickupLocation ? "border-red-500" : ""}
            />
            {errors.pickupLocation && <p className="text-red-500 text-sm mt-1">{errors.pickupLocation}</p>}
          </div>
          
          <div>
            <Label htmlFor="dropoffLocation">Drop-off Location</Label>
            <Input 
              id="dropoffLocation" 
              value={formData.dropoffLocation} 
              onChange={(e) => handleChange('dropoffLocation', e.target.value)}
              placeholder="e.g. Galle"
              className={errors.dropoffLocation ? "border-red-500" : ""}
            />
            {errors.dropoffLocation && <p className="text-red-500 text-sm mt-1">{errors.dropoffLocation}</p>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="withDriver" 
              checked={formData.withDriver} 
              onCheckedChange={(checked) => handleChange('withDriver', checked)}
            />
            <Label htmlFor="withDriver">Include Driver</Label>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickupDate">Pickup Date</Label>
              <Input 
                id="pickupDate" 
                type="date" 
                value={formData.pickupDate} 
                onChange={(e) => handleChange('pickupDate', e.target.value)}
                className={errors.pickupDate ? "border-red-500" : ""}
              />
              {errors.pickupDate && <p className="text-red-500 text-sm mt-1">{errors.pickupDate}</p>}
            </div>
            <div>
              <Label htmlFor="dropoffDate">Drop-off Date</Label>
              <Input 
                id="dropoffDate" 
                type="date" 
                value={formData.dropoffDate} 
                onChange={(e) => handleChange('dropoffDate', e.target.value)}
                className={errors.dropoffDate ? "border-red-500" : ""}
              />
              {errors.dropoffDate && <p className="text-red-500 text-sm mt-1">{errors.dropoffDate}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="pricePerDay">Price per Day</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
              <Input 
                id="pricePerDay" 
                type="text" 
                className={`pl-9 ${errors.pricePerDay ? "border-red-500" : ""}`}
                value={formData.pricePerDay} 
                onChange={(e) => handleChange('pricePerDay', e.target.value)}
              />
            </div>
            {errors.pricePerDay && <p className="text-red-500 text-sm mt-1">{errors.pricePerDay}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxPercent">Tax (%)</Label>
              <div className="relative">
                <Input 
                  id="taxPercent" 
                  type="text" 
                  value={formData.taxPercent} 
                  onChange={(e) => handleChange('taxPercent', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
            <div>
              <Label htmlFor="extraKMCharge">Extra KM Charge</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
                <Input 
                  id="extraKMCharge" 
                  type="text" 
                  className="pl-9" 
                  value={formData.extraKMCharge} 
                  onChange={(e) => handleChange('extraKMCharge', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="longRentalDiscount">Long Rental Discount (3+ days)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
              <Input 
                id="longRentalDiscount" 
                type="text" 
                className="pl-9" 
                value={formData.discounts.longRental} 
                onChange={(e) => handleNestedChange('discounts', 'longRental', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="status">Booking Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select booking status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          placeholder="Add any special requests or notes here" 
          value={formData.notes} 
          onChange={(e) => handleChange('notes', e.target.value)}
        />
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Total Price</h3>
              <p className="text-sm text-muted-foreground">Including taxes and discounts</p>
            </div>
            <div className="text-xl font-bold">Rs. {calculateTotal()}</div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
          {isSubmitting ? 'Creating...' : 'Create Booking'}
        </Button>
      </div>
    </form>
  );
};

export default VehicleBookingForm;