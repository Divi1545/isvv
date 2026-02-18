import React, { useState } from 'react';
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

interface WellnessBookingFormProps {
  onSuccess: () => void;
}

const WellnessBookingForm = ({ onSuccess }: WellnessBookingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    serviceType: '',
    duration: 60,
    sessionDate: '2025-05-25',
    time: '15:00',
    practitioner: '',
    pricePerSession: '6000',
    addOns: [] as string[],
    taxPercent: '10',
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

  const handleArrayToggle = (field: 'addOns', value: string) => {
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
    const pricePerSession = parseInt(formData.pricePerSession) || 0;
    const taxPercent = parseInt(formData.taxPercent) || 0;
    
    // Calculate add-on costs (assuming each add-on is Rs. 1500)
    const addOnPrice = 1500;
    const addOnTotal = formData.addOns.length * addOnPrice;
    
    const subtotal = pricePerSession + addOnTotal;
    const taxAmount = (subtotal * taxPercent) / 100;
    
    const total = subtotal + taxAmount;
    
    return total.toLocaleString();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.serviceType) newErrors.serviceType = "Service type is required";
    
    // Price validation
    if (!formData.pricePerSession || parseFloat(formData.pricePerSession) <= 0) {
      newErrors.pricePerSession = "Price per session must be greater than zero";
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
        type: 'wellness',
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
        description: "Wellness booking has been created successfully",
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
            <Label htmlFor="serviceType">Service Type</Label>
            <Select 
              value={formData.serviceType} 
              onValueChange={(value) => handleChange('serviceType', value)}
            >
              <SelectTrigger className={errors.serviceType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Massage">Massage</SelectItem>
                <SelectItem value="Ayurvedic Treatment">Ayurvedic Treatment</SelectItem>
                <SelectItem value="Yoga Session">Yoga Session</SelectItem>
                <SelectItem value="Meditation">Meditation</SelectItem>
                <SelectItem value="Spa Package">Spa Package</SelectItem>
                <SelectItem value="Wellness Consultation">Wellness Consultation</SelectItem>
              </SelectContent>
            </Select>
            {errors.serviceType && <p className="text-red-500 text-sm mt-1">{errors.serviceType}</p>}
          </div>
          
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select 
              value={formData.duration.toString()} 
              onValueChange={(value) => handleChange('duration', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionDate">Session Date</Label>
              <Input 
                id="sessionDate" 
                type="date" 
                value={formData.sessionDate} 
                onChange={(e) => handleChange('sessionDate', e.target.value)}
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
            <Label htmlFor="practitioner">Preferred Practitioner (Optional)</Label>
            <Input 
              id="practitioner" 
              value={formData.practitioner} 
              onChange={(e) => handleChange('practitioner', e.target.value)}
              placeholder="Enter name if you have a preference"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="pricePerSession">Price per Session</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs.</span>
              <Input 
                id="pricePerSession" 
                type="text" 
                className={`pl-9 ${errors.pricePerSession ? "border-red-500" : ""}`}
                value={formData.pricePerSession} 
                onChange={(e) => handleChange('pricePerSession', e.target.value)}
              />
            </div>
            {errors.pricePerSession && <p className="text-red-500 text-sm mt-1">{errors.pricePerSession}</p>}
          </div>
          
          <div>
            <Label className="mb-2 block">Add-ons (Rs. 1,500 each)</Label>
            <div className="grid grid-cols-2 gap-2">
              {['Herbal Pack', 'Aromatherapy', 'Hot Stone', 'Refreshments', 'Private Room'].map((addOn) => (
                <div key={addOn} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`add-on-${addOn}`} 
                    checked={formData.addOns.includes(addOn)}
                    onCheckedChange={() => handleArrayToggle('addOns', addOn)}
                  />
                  <label 
                    htmlFor={`add-on-${addOn}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {addOn}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
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
        <Label htmlFor="notes">Special Requests or Health Information</Label>
        <Textarea 
          id="notes" 
          placeholder="Add any special requests, health concerns, or preferences here" 
          value={formData.notes} 
          onChange={(e) => handleChange('notes', e.target.value)}
        />
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Total Price</h3>
              <p className="text-sm text-muted-foreground">Including add-ons and taxes</p>
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

export default WellnessBookingForm;