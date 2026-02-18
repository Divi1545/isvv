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
import { ArrowLeft, ArrowRight, Upload, MapPin, Building, User, Camera, Loader2, X } from "lucide-react";
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

  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    
    try {
      const formDataUpload = new FormData();
      files.forEach(file => {
        formDataUpload.append('images', file);
      });
      formDataUpload.append('folder', 'vendors');

      const response = await fetch('/api/upload/signup-images', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        handleInputChange('photos', [...formData.photos, ...result.urls]);
        toast({
          title: "Photos uploaded",
          description: `Successfully uploaded ${result.uploadedCount} photo(s).`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload photos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload error",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      
      if (formData.password.length < 6) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 6 characters long.",
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

      setIsSubmitting(true);

      // Submit vendor application - using correct endpoint
      const response = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.contactPerson || formData.businessName,
          businessName: formData.businessName,
          businessType: formData.businessType || 'accommodation',
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Application Submitted!",
          description: "Your vendor account has been created successfully. You can now sign in.",
        });
        
        // Show success message or redirect
        setCurrentStep(8); // Success step
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Failed to create account.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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
        const getPasswordStrength = (password: string) => {
          if (!password) return { strength: 0, label: '', color: '' };
          let strength = 0;
          if (password.length >= 6) strength++;
          if (password.length >= 10) strength++;
          if (/[A-Z]/.test(password)) strength++;
          if (/[0-9]/.test(password)) strength++;
          if (/[^A-Za-z0-9]/.test(password)) strength++;
          
          if (strength <= 1) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
          if (strength <= 3) return { strength: 2, label: 'Fair', color: 'bg-orange-500' };
          if (strength <= 4) return { strength: 3, label: 'Good', color: 'bg-yellow-500' };
          return { strength: 4, label: 'Strong', color: 'bg-green-500' };
        };
        
        const passwordStrength = getPasswordStrength(formData.password);
        const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
        
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
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${passwordStrength.strength >= 3 ? 'text-green-600' : 'text-orange-600'}`}>
                      Password strength: {passwordStrength.label}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Use at least 6 characters with a mix of letters, numbers & symbols
                </p>
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
                {formData.confirmPassword && (
                  <p className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
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
                {isUploading ? (
                  <>
                    <Loader2 className="mx-auto h-12 w-12 text-blue-600 mb-4 animate-spin" />
                    <p className="text-gray-600">Uploading photos...</p>
                  </>
                ) : (
                  <>
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
                      disabled={isUploading}
                    />
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB each</p>
                  </>
                )}
              </div>
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-24 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => handleInputChange('photos', formData.photos.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
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
      <div className="min-h-screen bg-gradient-to-br from-background via-green-50/30 to-emerald-50/30 dark:from-background dark:via-green-950/10 dark:to-emerald-950/10 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 dark:border-green-900 shadow-xl">
            <CardContent className="p-8 md:p-12">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-cyan-50/30 dark:from-background dark:via-blue-950/10 dark:to-cyan-950/10 py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="text-center flex-1">
                <CardTitle className="text-2xl md:text-3xl font-bold">Join IslandLoaf</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Step {currentStep} of {totalSteps}
                </p>
              </div>
              <div className="w-5" /> {/* Spacer */}
            </div>
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Business Type</span>
                <span>Account Setup</span>
                <span>Review</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>
            
            <div className="flex items-center justify-between pt-8 border-t mt-8">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              
              {currentStep === totalSteps ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.agreeToTerms || isSubmitting}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !formData.businessType) ||
                    (currentStep === 2 && (!formData.businessName || !formData.contactPerson || !formData.email)) ||
                    (currentStep === 4 && (!formData.password || !formData.confirmPassword))
                  }
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <span className="hidden sm:inline">Next Step</span>
                  <span className="sm:hidden">Next</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Help text */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Already have an account? <Link href="/login"><span className="text-primary hover:underline cursor-pointer font-medium">Sign in here</span></Link></p>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;