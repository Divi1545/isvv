import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";

interface StayBookingFormProps {
  onSuccess: () => void;
  user?: {
    id: number;
    email: string;
    full_name?: string;
  };
}

interface GuestCount {
  adults: number;
  children: number;
  infants: number;
}

const StayBookingForm = ({ onSuccess, user }: StayBookingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    // Booking details
    stayType: '',
    propertyType: '',
    propertySpace: 'Entire Place',
    themes: [] as string[],
    checkInDate: '2025-05-21',
    checkOutDate: '2025-05-23',
    guestCount: {
      adults: 2,
      children: 1,
      infants: 0
    } as GuestCount,
    amenities: [] as string[],
    basePrice: '25000',
    taxRate: '10',
    cleaningFee: '2000',
    discounts: {
      earlyBird: '1000',
      longStay: '3000'
    },
    source: 'direct',
    notes: '',
    status: 'pending',
    // Customer information
    customerName: user?.full_name || '',
    customerEmail: user?.email || '',
    customerPhone: ''
  });

  type FormDataKey = keyof typeof formData;
  type NestedKey = 'guestCount' | 'discounts';

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

  const handleArrayToggle = (field: 'themes' | 'amenities', value: string) => {
    const array = formData[field];
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];

    setFormData({
      ...formData,
      [field]: newArray
    });
    
    // Clear any error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const calculateTotal = () => {
    const basePrice = parseInt(formData.basePrice) || 0;
    const taxRate = parseInt(formData.taxRate) || 0;
    const cleaningFee = parseInt(formData.cleaningFee) || 0;
    const earlyBirdDiscount = parseInt(formData.discounts.earlyBird) || 0;
    const longStayDiscount = parseInt(formData.discounts.longStay) || 0;
    
    // Calculate nights (sample calculation)
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
    
    const subtotal = basePrice * nights;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalDiscounts = earlyBirdDiscount + longStayDiscount;
    
    const total = subtotal + taxAmount + cleaningFee - totalDiscounts;
    
    return total.toLocaleString();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.stayType) newErrors.stayType = "Stay type is required";
    if (!formData.propertyType) newErrors.propertyType = "Property type is required";
    
    // Customer information validation
    if (!formData.customerName) newErrors.customerName = "Guest name is required";
    if (formData.customerEmail && !/^\S+@\S+\.\S+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email address";
    }
    if (formData.customerPhone && !/^[\d\s\+\-\(\)]{7,15}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = "Please enter a valid phone number";
    }
    
    // Date validation
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    
    if (checkOut <= checkIn) {
      newErrors.checkOutDate = "Check-out date must be after check-in date";
    }
    
    // Price validation
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      newErrors.basePrice = "Base price must be greater than zero";
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
        type: 'stay',
        details: {
          ...formData,
          totalPrice
        },
        userId: user?.id || 1,
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
        description: "Booking has been created successfully",
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
            <Label htmlFor="stayType">Stay Type</Label>
            <Select 
              value={formData.stayType} 
              onValueChange={(value) => handleChange('stayType', value)}
            >
              <SelectTrigger className={errors.stayType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select stay type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Hotel Room</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="homestay">Homestay</SelectItem>
                <SelectItem value="resort">Resort</SelectItem>
              </SelectContent>
            </Select>
            {errors.stayType && <p className="text-red-500 text-sm mt-1">{errors.stayType}</p>}
          </div>
          
          <div>
            <Label htmlFor="propertyType">Property Type</Label>
            <Select 
              value={formData.propertyType} 
              onValueChange={(value) => handleChange('propertyType', value)}
            >
              <SelectTrigger className={errors.propertyType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="deluxe">Deluxe</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
              </SelectContent>
            </Select>
            {errors.propertyType && <p className="text-red-500 text-sm mt-1">{errors.propertyType}</p>}
          </div>
          
          <div>
            <Label htmlFor="propertySpace">Property Space</Label>
            <Select 
              value={formData.propertySpace} 
              onValueChange={(value) => handleChange('propertySpace', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property space" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entire">Entire Place</SelectItem>
                <SelectItem value="private">Private Room</SelectItem>
                <SelectItem value="shared">Shared Room</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="mb-2 block">Themes</Label>
            <div className="grid grid-cols-2 gap-2">
              {['Beachfront', 'Nature Retreat', 'City Center', 'Mountain View', 'Heritage'].map((theme) => (
                <div key={theme} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`theme-${theme}`} 
                    checked={formData.themes.includes(theme)}
                    onCheckedChange={() => handleArrayToggle('themes', theme)}
                  />
                  <label 
                    htmlFor={`theme-${theme}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {theme}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkInDate">Check-in Date</Label>
              <Input 
                id="checkInDate" 
                type="date" 
                value={formData.checkInDate} 
                onChange={(e) => handleChange('checkInDate', e.target.value)}
                className={errors.checkInDate ? "border-red-500" : ""}
              />
              {errors.checkInDate && <p className="text-red-500 text-sm mt-1">{errors.checkInDate}</p>}
            </div>
            <div>
              <Label htmlFor="checkOutDate">Check-out Date</Label>
              <Input 
                id="checkOutDate" 
                type="date" 
                value={formData.checkOutDate} 
                onChange={(e) => handleChange('checkOutDate', e.target.value)}
                className={errors.checkOutDate ? "border-red-500" : ""}
              />
              {errors.checkOutDate && <p className="text-red-500 text-sm mt-1">{errors.checkOutDate}</p>}
            </div>
          </div>
          
          <div>
            <Label className="mb-2 block">Guest Count</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="adults" className="text-xs">Adults</Label>
                <Input 
                  id="adults" 
                  type="number" 
                  min="1" 
                  value={formData.guestCount.adults} 
                  onChange={(e) => handleNestedChange('guestCount', 'adults', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="children" className="text-xs">Children</Label>
                <Input 
                  id="children" 
                  type="number" 
                  min="0" 
                  value={formData.guestCount.children} 
                  onChange={(e) => handleNestedChange('guestCount', 'children', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="infants" className="text-xs">Infants</Label>
                <Input 
                  id="infants" 
                  type="number" 
                  min="0" 
                  value={formData.guestCount.infants} 
                  onChange={(e) => handleNestedChange('guestCount', 'infants', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label className="mb-2 block">Amenities</Label>
            <div className="grid grid-cols-3 gap-2">
              {['Wi-Fi', 'A/C', 'Kitchen', 'Pool', 'Parking', 'TV', 'Hot Water', 'Laundry'].map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`amenity-${amenity}`} 
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => handleArrayToggle('amenities', amenity)}
                  />
                  <label 
                    htmlFor={`amenity-${amenity}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="basePrice">Base Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
              <Input 
                id="basePrice" 
                type="text" 
                className={`pl-9 ${errors.basePrice ? "border-red-500" : ""}`}
                value={formData.basePrice} 
                onChange={(e) => handleChange('basePrice', e.target.value)}
              />
            </div>
            {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <div className="relative">
                <Input 
                  id="taxRate" 
                  type="text" 
                  value={formData.taxRate} 
                  onChange={(e) => handleChange('taxRate', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
            <div>
              <Label htmlFor="cleaningFee">Cleaning Fee</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
                <Input 
                  id="cleaningFee" 
                  type="text" 
                  className="pl-9" 
                  value={formData.cleaningFee} 
                  onChange={(e) => handleChange('cleaningFee', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label className="mb-2 block">Discounts</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="earlyBirdDiscount" className="text-xs">Early Bird Discount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
                  <Input 
                    id="earlyBirdDiscount" 
                    type="text" 
                    className="pl-9" 
                    value={formData.discounts.earlyBird} 
                    onChange={(e) => handleNestedChange('discounts', 'earlyBird', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="longStayDiscount" className="text-xs">Long Stay Discount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
                  <Input 
                    id="longStayDiscount" 
                    type="text" 
                    className="pl-9" 
                    value={formData.discounts.longStay} 
                    onChange={(e) => handleNestedChange('discounts', 'longStay', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="source">Booking Source</Label>
            <Select 
              value={formData.source} 
              onValueChange={(value) => handleChange('source', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select booking source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct (Website/Phone)</SelectItem>
                <SelectItem value="booking.com">Booking.com</SelectItem>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="expedia">Expedia</SelectItem>
                <SelectItem value="agoda">Agoda</SelectItem>
                <SelectItem value="walkin">Walk-in</SelectItem>
              </SelectContent>
            </Select>
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
      
      <div className="mb-6 border p-4 rounded-md bg-muted/30">
        <h3 className="text-md font-medium mb-4">Guest Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="customerName">Guest Name</Label>
            <Input 
              id="customerName" 
              value={formData.customerName} 
              onChange={(e) => handleChange('customerName', e.target.value)}
              placeholder="John Doe"
              className={errors.customerName ? "border-red-500" : ""}
            />
            {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
          </div>
          <div>
            <Label htmlFor="customerEmail">Email Address</Label>
            <Input 
              id="customerEmail" 
              type="email" 
              value={formData.customerEmail} 
              onChange={(e) => handleChange('customerEmail', e.target.value)}
              placeholder="johndoe@example.com"
              className={errors.customerEmail ? "border-red-500" : ""}
            />
            {errors.customerEmail && <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>}
          </div>
          <div>
            <Label htmlFor="customerPhone">Phone Number</Label>
            <Input 
              id="customerPhone" 
              value={formData.customerPhone} 
              onChange={(e) => handleChange('customerPhone', e.target.value)}
              placeholder="+94 71 234 5678"
              className={errors.customerPhone ? "border-red-500" : ""}
            />
            {errors.customerPhone && <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <Label htmlFor="notes">Special Requests or Notes</Label>
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
              <p className="text-sm text-muted-foreground">Including taxes, fees and discounts</p>
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

export default StayBookingForm;