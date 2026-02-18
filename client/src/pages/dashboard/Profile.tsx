import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Mock user data
const mockUser = {
  id: 1,
  username: "vendor",
  email: "vendor@islandloaf.com",
  fullName: "Island Vendor",
  businessName: "Beach Paradise Villa",
  businessType: "accommodation",
  phone: "+94 76 123 4567",
  description: "Luxury beachfront villa with private pool and stunning ocean views. Perfect for families and couples seeking a tranquil escape in paradise.",
  address: "123 Beach Road, Unawatuna, Galle, Sri Lanka",
  role: "vendor"
};

const Profile = () => {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'bank',
      name: 'Bank Account',
      details: 'Primary • Local Bank Ltd. ending in 4582',
      isPrimary: true
    }
  ]);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    type: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: ''
  });
  
  const handleConnectMarketplace = async () => {
    try {
      const res = await fetch('/api/vendor/connect-marketplace', { method: 'POST' });
      if (res.ok) {
        toast({
          title: "Success",
          description: "Connected successfully to marketplace"
        });
      } else {
        throw new Error("Failed to connect");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to marketplace",
        variant: "destructive"
      });
    }
  };

  const handleAddPaymentMethod = () => {
    const newMethod = {
      id: paymentMethods.length + 1,
      type: newPayment.type,
      name: newPayment.type === 'credit_card' ? 'Credit Card' : 'Bank Account',
      details: newPayment.type === 'credit_card' 
        ? `**** **** **** ${newPayment.cardNumber.slice(-4)}` 
        : `${newPayment.bankName} ending in ${newPayment.accountNumber.slice(-4)}`,
      isPrimary: false
    };
    
    setPaymentMethods([...paymentMethods, newMethod]);
    setIsAddPaymentOpen(false);
    setNewPayment({
      type: 'credit_card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      holderName: '',
      bankName: '',
      accountNumber: '',
      routingNumber: ''
    });
    
    toast({
      title: "Success",
      description: "Payment method added successfully"
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <Button 
          className="w-full md:w-auto"
          onClick={handleConnectMarketplace}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
            <path d="M8.5 8.5v.01"></path>
            <path d="M16 15.5v.01"></path>
            <path d="M12 12v.01"></path>
            <path d="M11 17v.01"></path>
            <path d="M7 14v.01"></path>
          </svg>
          Connect to Marketplace
        </Button>
      </div>
      
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="business" className="mt-4 space-y-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2 relative group">
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                        <Button variant="ghost" size="sm" className="text-transparent group-hover:text-white">
                          Change
                        </Button>
                      </div>
                      <span className="text-5xl text-gray-400">BP</span>
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold">{mockUser.businessName}</h3>
                      <p className="text-sm text-muted-foreground">{mockUser.businessType}</p>
                    </div>
                    <div className="text-center text-sm p-3 bg-green-50 text-green-700 rounded-md border border-green-200 w-full">
                      <p className="font-medium">Verified Business</p>
                      <p className="mt-1">Joined January 2023</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-2/3 space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Name</label>
                      <Input defaultValue={mockUser.businessName} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Type</label>
                      <Select defaultValue={mockUser.businessType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accommodation">Accommodation</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="activity">Activity/Tour</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="wellness">Wellness</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Description</label>
                    <Textarea 
                      defaultValue={mockUser.description} 
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">This description will be shown to potential customers on your listings.</p>
                  </div>
                  
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input defaultValue={mockUser.phone} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input defaultValue={mockUser.email} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Address</label>
                    <Input defaultValue={mockUser.address} />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Services Offered</label>
                    <div className="grid gap-3 grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="wifi" defaultChecked />
                        <Label htmlFor="wifi">WiFi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="breakfast" defaultChecked />
                        <Label htmlFor="breakfast">Breakfast</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="parking" defaultChecked />
                        <Label htmlFor="parking">Free Parking</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="pool" defaultChecked />
                        <Label htmlFor="pool">Swimming Pool</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="ac" defaultChecked />
                        <Label htmlFor="ac">Air Conditioning</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="pets" />
                        <Label htmlFor="pets">Pet Friendly</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="mt-4 space-y-5">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input defaultValue={mockUser.fullName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <Input defaultValue={mockUser.username} />
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input defaultValue={mockUser.email} type="email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input defaultValue={mockUser.phone} />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Security</h4>
                  <div className="space-y-4">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Current Password</label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div></div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Confirm New Password</label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive emails about new bookings and messages</p>
                      </div>
                      <Switch id="email-notif" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive SMS alerts for urgent notifications</p>
                      </div>
                      <Switch id="sms-notif" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Marketing Communications</p>
                        <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                      </div>
                      <Switch id="marketing" />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-4 space-y-5">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
              <div className="space-y-5">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-4 bg-blue-100 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                            {method.type === 'credit_card' ? (
                              <>
                                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                                <line x1="2" x2="22" y1="10" y2="10"></line>
                              </>
                            ) : (
                              <>
                                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                                <line x1="2" x2="22" y1="10" y2="10"></line>
                              </>
                            )}
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.details}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="p-4 border rounded-lg border-dashed">
                  <div className="flex items-center justify-center py-4">
                    <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M5 12h14"></path>
                            <path d="M12 5v14"></path>
                          </svg>
                          Add Payment Method
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Payment Method</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Payment Type</Label>
                            <Select value={newPayment.type} onValueChange={(value) => setNewPayment({...newPayment, type: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="credit_card">Credit Card</SelectItem>
                                <SelectItem value="bank_account">Bank Account</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {newPayment.type === 'credit_card' ? (
                            <>
                              <div className="space-y-2">
                                <Label>Cardholder Name</Label>
                                <Input 
                                  value={newPayment.holderName}
                                  onChange={(e) => setNewPayment({...newPayment, holderName: e.target.value})}
                                  placeholder="John Doe"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Card Number</Label>
                                <Input 
                                  value={newPayment.cardNumber}
                                  onChange={(e) => setNewPayment({...newPayment, cardNumber: e.target.value})}
                                  placeholder="1234 5678 9012 3456"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Expiry Date</Label>
                                  <Input 
                                    value={newPayment.expiryDate}
                                    onChange={(e) => setNewPayment({...newPayment, expiryDate: e.target.value})}
                                    placeholder="MM/YY"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>CVV</Label>
                                  <Input 
                                    value={newPayment.cvv}
                                    onChange={(e) => setNewPayment({...newPayment, cvv: e.target.value})}
                                    placeholder="123"
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <Label>Bank Name</Label>
                                <Input 
                                  value={newPayment.bankName}
                                  onChange={(e) => setNewPayment({...newPayment, bankName: e.target.value})}
                                  placeholder="Commercial Bank"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Account Number</Label>
                                <Input 
                                  value={newPayment.accountNumber}
                                  onChange={(e) => setNewPayment({...newPayment, accountNumber: e.target.value})}
                                  placeholder="1234567890"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Routing Number</Label>
                                <Input 
                                  value={newPayment.routingNumber}
                                  onChange={(e) => setNewPayment({...newPayment, routingNumber: e.target.value})}
                                  placeholder="011234567"
                                />
                              </div>
                            </>
                          )}
                          
                          <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddPaymentMethod}>
                              Add Payment Method
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Payment Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Automatic Payouts</p>
                        <p className="text-sm text-muted-foreground">Automatically transfer funds to your bank account</p>
                      </div>
                      <Switch id="auto-payout" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Invoicing</p>
                        <p className="text-sm text-muted-foreground">Automatically generate invoices for completed bookings</p>
                      </div>
                      <Switch id="invoicing" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Account Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Account Balance</p>
                        <p className="text-sm text-green-600 font-medium">$1,284.50</p>
                      </div>
                      <Button variant="outline" size="sm">Withdraw</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Next Payout</p>
                        <p className="text-sm text-muted-foreground">May 25, 2025</p>
                      </div>
                      <p className="text-sm font-medium">$425.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;