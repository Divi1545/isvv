import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";

interface TicketBookingFormProps {
  onSuccess: () => void;
}

const TicketBookingForm = ({ onSuccess }: TicketBookingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    ticketType: '',
    location: '',
    eventDate: '2025-06-01',
    time: '09:00',
    guestCount: 3,
    pricePerPerson: '4500',
    groupDiscount: '500',
    notes: '',
    status: 'pending'
  });

  type FormDataKey = keyof typeof formData;
  
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

  const calculateTotal = () => {
    const pricePerPerson = parseInt(formData.pricePerPerson) || 0;
    const groupDiscount = parseInt(formData.groupDiscount) || 0;
    const guestCount = formData.guestCount || 1;
    
    const subtotal = pricePerPerson * guestCount;
    
    // Apply group discount only for groups of 3 or more
    const discountAmount = guestCount >= 3 ? groupDiscount * guestCount : 0;
    
    const total = subtotal - discountAmount;
    
    return total.toLocaleString();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.ticketType) newErrors.ticketType = "Ticket type is required";
    if (!formData.location) newErrors.location = "Location is required";
    
    // Price validation
    if (!formData.pricePerPerson || parseFloat(formData.pricePerPerson) <= 0) {
      newErrors.pricePerPerson = "Price per person must be greater than zero";
    }
    
    // Guest count validation
    if (!formData.guestCount || formData.guestCount < 1) {
      newErrors.guestCount = "Guest count must be at least 1";
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
        type: 'ticket',
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
        description: "Ticket booking has been created successfully",
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
            <Label htmlFor="ticketType">Ticket Type</Label>
            <Select 
              value={formData.ticketType} 
              onValueChange={(value) => handleChange('ticketType', value)}
            >
              <SelectTrigger className={errors.ticketType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select ticket type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day Tour">Day Tour</SelectItem>
                <SelectItem value="Heritage Site">Heritage Site</SelectItem>
                <SelectItem value="Cultural Show">Cultural Show</SelectItem>
                <SelectItem value="Adventure Activity">Adventure Activity</SelectItem>
                <SelectItem value="Wildlife Safari">Wildlife Safari</SelectItem>
                <SelectItem value="Boat Tour">Boat Tour</SelectItem>
                <SelectItem value="Museum">Museum</SelectItem>
              </SelectContent>
            </Select>
            {errors.ticketType && <p className="text-red-500 text-sm mt-1">{errors.ticketType}</p>}
          </div>
          
          <div>
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              value={formData.location} 
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g. Sigiriya"
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventDate">Event Date</Label>
              <Input 
                id="eventDate" 
                type="date" 
                value={formData.eventDate} 
                onChange={(e) => handleChange('eventDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input 
                id="time" 
                type="time" 
                value={formData.time} 
                onChange={(e) => handleChange('time', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="guestCount">Number of Guests</Label>
            <Input 
              id="guestCount" 
              type="number" 
              min="1" 
              value={formData.guestCount} 
              onChange={(e) => handleChange('guestCount', parseInt(e.target.value))}
              className={errors.guestCount ? "border-red-500" : ""}
            />
            {errors.guestCount && <p className="text-red-500 text-sm mt-1">{errors.guestCount}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="pricePerPerson">Price per Person</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
              <Input 
                id="pricePerPerson" 
                type="text" 
                className={`pl-9 ${errors.pricePerPerson ? "border-red-500" : ""}`}
                value={formData.pricePerPerson} 
                onChange={(e) => handleChange('pricePerPerson', e.target.value)}
              />
            </div>
            {errors.pricePerPerson && <p className="text-red-500 text-sm mt-1">{errors.pricePerPerson}</p>}
          </div>
          
          <div>
            <Label htmlFor="groupDiscount">Group Discount (per person)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
              <Input 
                id="groupDiscount" 
                type="text" 
                className="pl-9" 
                value={formData.groupDiscount} 
                onChange={(e) => handleChange('groupDiscount', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Applied for groups of 3 or more</p>
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
              <p className="text-sm text-muted-foreground">Including group discounts</p>
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

export default TicketBookingForm;