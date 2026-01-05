import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Upload, MapPin, Building, User, Camera } from "lucide-react";
import { Link } from "wouter";

const VendorSignup = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  type VendorSignupFormData = {
    businessType: string;
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    address: string;
    city: string;
    country: string;
    description: string;
    category: string;
    operationalDays: string[];
    baseRate: string;
    photos: string[];
    agreeToTerms: boolean;
  };

  const [formData, setFormData] = useState<VendorSignupFormData>({
    businessType: "",
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    country: "Sri Lanka",
    description: "",
    category: "",
    operationalDays: [],
    baseRate: "",
    photos: [],
    agreeToTerms: false,
  });

  const businessTypes = [
    { value: 'hotel', label: 'Hotel / Resort' },
    { value: 'villa', label: 'Villa / Vacation Rental' },
    { value: 'guesthouse', label: 'Guesthouse / B&B' },
    { value: 'tour', label: 'Tour Operator' },
    { value: 'transport', label: 'Transportation' },
    { value: 'activity', label: 'Activities / Adventures' },
    { value: 'restaurant', label: 'Restaurant / Dining' },
    { value: 'spa', label: 'Spa / Wellness' },
    { value: 'shopping', label: 'Shopping / Souvenirs' }
  ];

  const categories = [
    'Luxury', 'Budget-Friendly', 'Family-Friendly', 'Couples', 'Adventure', 
    'Cultural', 'Beach', 'Mountain', 'City', 'Wildlife', 'Water Sports', 'Dining'
  ];

  const operationalDaysOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const totalSteps = 7;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    const updatedDays = formData.operationalDays.includes(day)
      ? formData.operationalDays.filter(d => d !== day)
      : [...formData.operationalDays, day];
    handleInputChange('operationalDays', updatedDays);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // In a real app, you'd upload these to cloud storage
    const photoUrls = files.map(file => URL.createObjectURL(file));
    handleInputChange('photos', [...formData.photos, ...photoUrls]);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.businessName || !formData.email || !formData.password) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match.",
          variant: "destructive"
        });
        return;
      }

      if (!formData.agreeToTerms) {
        toast({
          title: "Terms Required",
          description: "Please agree to the terms and conditions.",
          variant: "destructive"
        });
        return;
      }

      // Submit vendor application
      const response = await fetch('/api/vendors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.businessName.toLowerCase().replace(/\s+/g, '_'),
          email: formData.email,
          password: formData.password,
          fullName: formData.contactPerson,
          businessName: formData.businessName,
          businessType: formData.businessType,
          phone: formData.phone,
          address: formData.address,
          description: formData.description,
          role: 'vendor',
          status: 'pending',
          categories: formData.category,
          operationalDays: formData.operationalDays,
          baseRate: parseFloat(formData.baseRate) || 0
        })
      });

      if (response.ok) {
        toast({
          title: "Application Submitted!",
          description: "Your vendor application has been submitted for review. You'll receive an email once approved.",
        });
        
        // Show success message or redirect
        setCurrentStep(8); // Success step
      } else {
        const error = await response.json();
        toast({
          title: "Submission Failed",
          description: error.error || "Failed to submit application.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Building className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold">What type of business do you have?</h2>
              <p className="text-gray-600">Choose the category that best describes your service</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {businessTypes.map((type) => (
                <Card 
                  key={type.value}
                  className={`cursor-pointer border-2 transition-colors ${
                    formData.businessType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('businessType', type.value)}
                >
                  <CardContent className="p-4 text-center">
                    <p className="font-medium">{type.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold">Tell us about your business</h2>
              <p className="text-gray-600">Basic information about your business and contact details</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Paradise Beach Villa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="John Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contact@paradisebeach.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+94 76 123 4567"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <MapPin className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold">Where is your business located?</h2>
              <p className="text-gray-600">Help customers find you easily</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Beach Road, Unawatuna, Galle, Sri Lanka"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Galle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                      <SelectItem value="Maldives">Maldives</SelectItem>
                      <SelectItem value="Seychelles">Seychelles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Create your account</h2>
              <p className="text-gray-600">Secure access to your vendor dashboard</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a strong password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Service Details</h2>
              <p className="text-gray-600">Tell customers what makes your service special</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your business, services, and what makes it unique..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseRate">Starting Rate (LKR)</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    value={formData.baseRate}
                    onChange={(e) => handleInputChange('baseRate', e.target.value)}
                    placeholder="5000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operational Days</Label>
                <div className="grid grid-cols-4 gap-2">
                  {operationalDaysOptions.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={formData.operationalDays.includes(day)}
                        onCheckedChange={() => handleDayToggle(day)}
                      />
                      <Label htmlFor={day} className="text-sm">{day.slice(0, 3)}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Camera className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold">Add Photos</h2>
              <p className="text-gray-600">Showcase your business with high-quality images</p>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <Label htmlFor="photos" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">Upload photos</span>
                  <span className="text-gray-600"> or drag and drop</span>
                </Label>
                <Input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB each</p>
              </div>
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-24 object-cover rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Terms & Conditions</h2>
              <p className="text-gray-600">Please review and accept our terms</p>
            </div>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 h-40 overflow-y-auto bg-gray-50">
                <h3 className="font-semibold mb-2">IslandLoaf Vendor Agreement</h3>
                <p className="text-sm text-gray-600 mb-2">
                  By joining IslandLoaf as a vendor, you agree to provide accurate information about your services,
                  maintain professional standards, and comply with local regulations.
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Commission: 8% on completed bookings. Payments processed within 7 business days.
                </p>
                <p className="text-sm text-gray-600">
                  You maintain the right to update pricing, availability, and service details through your dashboard.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the Terms & Conditions and Privacy Policy
                </Label>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600">Application Submitted!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Thank you for applying to become a vendor on IslandLoaf. Our team will review your application 
              and contact you within 2-3 business days.
            </p>
            <div className="pt-4">
              <Link href="/login">
                <Button>Return to Login</Button>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (currentStep === 8) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Link href="/login" className="text-blue-600 hover:text-blue-500">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="text-center flex-1">
                <CardTitle className="text-2xl">Join IslandLoaf</CardTitle>
                <p className="text-gray-600">Step {currentStep} of {totalSteps}</p>
              </div>
              <div className="w-5" /> {/* Spacer */}
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          <CardContent className="p-8">
            {renderStepContent()}
            
            <div className="flex justify-between pt-8">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep === totalSteps ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.agreeToTerms}
                  className="flex items-center"
                >
                  Submit Application
                </Button>
              ) : (
                <Button 
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !formData.businessType) ||
                    (currentStep === 2 && (!formData.businessName || !formData.contactPerson || !formData.email)) ||
                    (currentStep === 4 && (!formData.password || !formData.confirmPassword))
                  }
                  className="flex items-center"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorSignup;