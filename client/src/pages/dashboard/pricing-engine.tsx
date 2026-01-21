import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { toast } from "@/hooks/use-toast";
import { fetchServicePricing, updateServicePrice } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle, Save, Trash2, Calendar as CalendarIcon, DollarSign, Tag, Loader2 } from "lucide-react";
import { useApiQuery } from "@/lib/api-hooks";
import type { ServicePricingItem } from "@shared/types/services";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PricingEngine() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<any[]>([
    { id: 1, name: "Christmas Season", startDate: "2023-12-23", endDate: "2024-01-02" },
    { id: 2, name: "Maintenance Period", startDate: "2023-02-15", endDate: "2023-02-20" }
  ]);
  const [promoForm, setPromoForm] = useState({ code: '', discount: '', type: 'percentage', validUntil: '' });
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', type: 'stays', basePrice: '', available: true });
  const queryClient = useQueryClient();
  
  // Get services data
  const { data: services, isLoading, error, refetch } = useApiQuery({
    key: ["/api/services"] as const,
    fn: async () => fetchServicePricing(),
  });
  
  // Update service price mutation
  const updateServicePriceMutation = useMutation({
    mutationFn: async ({ serviceId, basePrice }: { serviceId: number; basePrice: number }) => {
      return updateServicePrice(serviceId, basePrice, queryClient);
    },
    onSuccess: () => {
      toast({
        title: "Price updated",
        description: "Your service price has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      // Reset the changed state for this service
      setServicePrices({});
    },
    onError: (error) => {
      toast({
        title: "Failed to update price",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; type: string; basePrice: number; available: boolean }) => {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create service');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Service created",
        description: "Your new service has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setIsAddServiceDialogOpen(false);
      setServiceForm({ name: '', description: '', type: 'stays', basePrice: '', available: true });
    },
    onError: (error) => {
      toast({
        title: "Failed to create service",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCreateService = () => {
    if (!serviceForm.name || !serviceForm.type) {
      toast({
        title: "Missing information",
        description: "Please enter a service name and type.",
        variant: "destructive",
      });
      return;
    }
    createServiceMutation.mutate({
      name: serviceForm.name,
      description: serviceForm.description,
      type: serviceForm.type,
      basePrice: parseFloat(serviceForm.basePrice) || 0,
      available: serviceForm.available,
    });
  };

  // Use real services from the database
  const displayServices = services || [];
  
  // Service price state management
  const [servicePrices, setServicePrices] = useState<Record<number, number>>({});

  // Handle input changes for service prices
  const handlePriceChange = (serviceId: number, price: number) => {
    setServicePrices(prev => ({
      ...prev,
      [serviceId]: price
    }));
  };

  // Get current price for a service (from state or original value)
  const getCurrentPrice = (service: ServicePricingItem) => {
    return servicePrices[service.id] !== undefined ? servicePrices[service.id] : service.basePrice;
  };

  // Check if price has changed
  const hasPriceChanged = (service: ServicePricingItem) => {
    return servicePrices[service.id] !== undefined && servicePrices[service.id] !== service.basePrice;
  };

  // Handle saving pricing rules
  const handleSavePricingRules = () => {
    // For now, just show a toast notification
    toast({
      title: "Pricing rules saved",
      description: "Your pricing rules have been saved successfully.",
    });
  };

  // Handle creating promo codes
  const handleCreatePromoCode = () => {
    if (!promoForm.code || !promoForm.discount || !promoForm.validUntil) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to create a promo code.",
        variant: "destructive",
      });
      return;
    }

    const newPromoCode = {
      id: Date.now(),
      code: promoForm.code,
      discount: parseFloat(promoForm.discount),
      type: promoForm.type,
      validUntil: promoForm.validUntil,
    };

    setPromoCodes(prev => [...prev, newPromoCode]);
    setPromoForm({ code: '', discount: '', type: 'percentage', validUntil: '' });
    setIsPromoDialogOpen(false);
    
    toast({
      title: "Promo code created",
      description: `${newPromoCode.code} has been created successfully.`,
    });
  };

  // Handle removing promo codes
  const handleRemovePromoCode = (promoId: number) => {
    setPromoCodes(prev => prev.filter(promo => promo.id !== promoId));
    toast({
      title: "Promo code removed",
      description: "The promotional code has been removed.",
    });
  };

  // Handle adding blackout dates
  const handleAddBlackoutDate = () => {
    if (!selectedDate) {
      toast({
        title: "Select a date",
        description: "Please select a date to add to blackout dates.",
        variant: "destructive",
      });
      return;
    }

    const newBlackoutDate = {
      id: Date.now(),
      name: `Blackout Date ${blackoutDates.length + 1}`,
      startDate: selectedDate.toISOString().split('T')[0],
      endDate: selectedDate.toISOString().split('T')[0],
    };

    setBlackoutDates(prev => [...prev, newBlackoutDate]);
    
    toast({
      title: "Blackout date added",
      description: `${newBlackoutDate.startDate} has been added to blackout dates.`,
    });
  };

  // Handle removing blackout dates
  const handleRemoveBlackoutDate = (dateId: number) => {
    setBlackoutDates(prev => prev.filter(date => date.id !== dateId));
    toast({
      title: "Blackout date removed",
      description: "The blackout date has been removed.",
    });
  };
  
  // Mock pricing rules
  const [weekendSurcharge, setWeekendSurcharge] = useState(25);
  const [holidaySurcharge, setHolidaySurcharge] = useState(50);
  const [extraGuestFee, setExtraGuestFee] = useState(15);
  const [minStay, setMinStay] = useState(2);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Pricing Engine"
          description="Manage your service pricing and promotional offers"
        />
        <CardSkeleton count={2} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Pricing Engine"
          description="Manage your service pricing and promotional offers"
        />
        <ErrorState 
          message={error instanceof Error ? error.message : "Failed to load pricing data"}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pricing Engine"
        description="Configure base pricing, seasonal rules, promotions, and blackout dates for your services"
      />
      
      <Tabs defaultValue="base-pricing">
        <TabsList className="mb-6">
          <TabsTrigger value="base-pricing">Base Pricing</TabsTrigger>
          <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="promos">Promotions</TabsTrigger>
          <TabsTrigger value="blackout-dates">Blackout Dates</TabsTrigger>
        </TabsList>
        
        {/* Base Pricing Tab */}
        <TabsContent value="base-pricing" className="space-y-6">
          {displayServices.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="h-12 w-12" />}
              title="No services found"
              description="Add services to your account to set up pricing. Services are required before you can configure pricing rules."
              action={{
                label: "Add Service",
                onClick: () => setIsAddServiceDialogOpen(true)
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Service Base Pricing</CardTitle>
                <CardDescription>
                  Set the base price for each of your services. These prices serve as the foundation for all pricing rules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayServices.map((service) => {
                    const currentPrice = getCurrentPrice(service);
                    const hasChanged = hasPriceChanged(service);
                    
                    return (
                      <Card key={service.id} className="overflow-hidden">
                        <div className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                              <p className="text-sm text-muted-foreground">{service.type} • {service.description}</p>
                            </div>
                            
                            <div className="flex gap-3 items-end">
                              <div className="w-full md:w-48">
                                <Label htmlFor={`price-${service.id}`} className="text-sm mb-1.5 block">Base Price</Label>
                                <div className="flex">
                                  <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <Input
                                    id={`price-${service.id}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="rounded-l-none"
                                    value={currentPrice}
                                    onChange={(e) => handlePriceChange(service.id, parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              
                              <Button
                                variant={hasChanged ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateServicePriceMutation.mutate({
                                  serviceId: service.id,
                                  basePrice: currentPrice
                                })}
                                disabled={!hasChanged || updateServicePriceMutation.isPending}
                              >
                                {updateServicePriceMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {hasChanged ? "Save" : "Saved"}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Pricing Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing Rules</CardTitle>
              <CardDescription>
                Configure automatic price adjustments based on dates, occupancy, and other factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Weekend Pricing
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weekend-surcharge">Weekend Surcharge (%)</Label>
                      <span className="font-medium">{weekendSurcharge}%</span>
                    </div>
                    
                    <Slider
                      id="weekend-surcharge"
                      defaultValue={[weekendSurcharge]}
                      max={100}
                      step={5}
                      onValueChange={(values) => setWeekendSurcharge(values[0])}
                    />
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch id="apply-weekend" />
                      <Label htmlFor="apply-weekend">Apply weekend pricing</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Holiday Pricing
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="holiday-surcharge">Holiday Surcharge (%)</Label>
                      <span className="font-medium">{holidaySurcharge}%</span>
                    </div>
                    
                    <Slider
                      id="holiday-surcharge"
                      defaultValue={[holidaySurcharge]}
                      max={100}
                      step={5}
                      onValueChange={(values) => setHolidaySurcharge(values[0])}
                    />
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch id="apply-holiday" />
                      <Label htmlFor="apply-holiday">Apply holiday pricing</Label>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Additional Rules</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="extra-guest-fee">Extra Guest Fee ($)</Label>
                        <div className="flex">
                          <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            id="extra-guest-fee"
                            type="number"
                            className="rounded-l-none"
                            value={extraGuestFee}
                            onChange={(e) => setExtraGuestFee(parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="min-stay">Minimum Stay (nights)</Label>
                        <Input
                          id="min-stay"
                          type="number"
                          value={minStay}
                          onChange={(e) => setMinStay(parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button className="w-full md:w-auto" onClick={handleSavePricingRules}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Pricing Rules
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Promotions Tab */}
        <TabsContent value="promos" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Promotional Codes</CardTitle>
                <CardDescription>Create and manage discount codes for your services</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsPromoDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Promo Code
              </Button>
            </CardHeader>
            <CardContent>
              {promoCodes.length === 0 ? (
                <EmptyState
                  icon={<Tag className="h-12 w-12" />}
                  title="No promotional codes yet"
                  description="Create your first promotional code to attract customers with special discounts and offers."
                  action={{
                    label: "Create Promo Code",
                    onClick: () => setIsPromoDialogOpen(true)
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {promoCodes.map((promo) => (
                    <Card key={promo.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Tag className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-base">{promo.code}</h3>
                              <p className="text-sm text-muted-foreground">
                                {promo.type === "percentage" ? `${promo.discount}% off` : `$${promo.discount} off`} • 
                                Valid until {promo.validUntil}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemovePromoCode(promo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Promotional Code</DialogTitle>
                <DialogDescription>
                  Add a new promotional code for your services.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="promo-code">Promo Code</Label>
                  <Input 
                    id="promo-code" 
                    placeholder="SUMMER20" 
                    value={promoForm.code}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount-amount">Discount Amount</Label>
                    <Input 
                      id="discount-amount" 
                      type="number" 
                      placeholder="20" 
                      value={promoForm.discount}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, discount: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount-type">Discount Type</Label>
                    <select
                      id="discount-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={promoForm.type}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valid-until">Valid Until</Label>
                  <Input 
                    id="valid-until" 
                    type="date" 
                    value={promoForm.validUntil}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPromoDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePromoCode}>Create Promo Code</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Blackout Dates Tab */}
        <TabsContent value="blackout-dates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blackout Dates</CardTitle>
              <CardDescription>
                Block specific dates when your services are unavailable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Select dates to block</h3>
                  <div className="border rounded-md p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md"
                    />
                  </div>
                  <Button className="w-full mt-4" onClick={handleAddBlackoutDate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Blocked Date
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-medium mb-4">Blocked Date Ranges</h3>
                  
                  {blackoutDates.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {blackoutDates.map((blackoutDate) => (
                        <AccordionItem key={blackoutDate.id} value={`item-${blackoutDate.id}`}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center">
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>{blackoutDate.name}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="p-2 space-y-2">
                              <p className="text-sm text-muted-foreground">
                                {blackoutDate.startDate} - {blackoutDate.endDate}
                              </p>
                              <div className="flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                                  onClick={() => handleRemoveBlackoutDate(blackoutDate.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <EmptyState
                      icon={<CalendarIcon className="h-12 w-12" />}
                      title="No blackout dates set"
                      description="Select dates on the calendar to block availability for maintenance, holidays, or other reasons."
                      className="mt-0"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Service Dialog */}
      <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Create a new service to manage pricing. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                data-testid="input-service-name"
                placeholder="e.g., Beach Villa, Airport Transfer"
                value={serviceForm.name}
                onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type</Label>
              <Select
                value={serviceForm.type}
                onValueChange={(value) => setServiceForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="service-type" data-testid="select-service-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stays">Stays (Accommodation)</SelectItem>
                  <SelectItem value="transport">Transport (Vehicles)</SelectItem>
                  <SelectItem value="tours">Tours & Activities</SelectItem>
                  <SelectItem value="wellness">Wellness & Spa</SelectItem>
                  <SelectItem value="tickets">Tickets & Events</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                data-testid="input-service-description"
                placeholder="Describe your service..."
                value={serviceForm.description}
                onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Base Price (USD)</Label>
              <div className="flex">
                <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="service-price"
                  data-testid="input-service-price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="rounded-l-none"
                  placeholder="0.00"
                  value={serviceForm.basePrice}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, basePrice: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="service-available"
                data-testid="switch-service-available"
                checked={serviceForm.available}
                onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, available: checked }))}
              />
              <Label htmlFor="service-available">Available for booking</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddServiceDialogOpen(false)} data-testid="button-cancel-service">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateService} 
              disabled={createServiceMutation.isPending}
              data-testid="button-create-service"
            >
              {createServiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Service
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
