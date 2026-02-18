import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

// New Campaign creation page
const NewCampaignPage = () => {
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('email');
  const [campaignTarget, setCampaignTarget] = useState('all_vendors');
  const [campaignContent, setCampaignContent] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [sendDate, setSendDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName || !campaignContent) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would save the campaign to the database
    toast({
      title: "Campaign created",
      description: `Your "${campaignName}" campaign has been scheduled for ${sendDate}`
    });
    
    // Go back to the campaigns list
    localStorage.removeItem("adminAction");
    window.location.reload();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Create New Campaign</h1>
        <Button variant="outline" onClick={() => {
          localStorage.removeItem("adminAction");
          window.location.reload();
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="m12 19-7-7 7-7"></path>
            <path d="M19 12H5"></path>
          </svg>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Fill in the details for your new marketing campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Name*</label>
                <Input 
                  placeholder="Summer Special 2025" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Type*</label>
                <Select value={campaignType} onValueChange={setCampaignType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Campaign</SelectItem>
                    <SelectItem value="sms">SMS Campaign</SelectItem>
                    <SelectItem value="notification">In-App Notification</SelectItem>
                    <SelectItem value="promo">Promo Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience*</label>
                <Select value={campaignTarget} onValueChange={setCampaignTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_vendors">All Vendors</SelectItem>
                    <SelectItem value="accommodation">Accommodation Vendors</SelectItem>
                    <SelectItem value="tours">Tour Operators</SelectItem>
                    <SelectItem value="wellness">Wellness Vendors</SelectItem>
                    <SelectItem value="transportation">Transportation Vendors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Date*</label>
                <Input 
                  type="date" 
                  value={sendDate}
                  onChange={(e) => setSendDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              
              {campaignType === 'promo' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Promo Code*</label>
                    <Input 
                      placeholder="SUMMER2025" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount Amount (%)*</label>
                    <Input 
                      type="number" 
                      placeholder="25" 
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Content*</label>
              <Textarea 
                placeholder="Enter your campaign message here..." 
                rows={6}
                value={campaignContent}
                onChange={(e) => setCampaignContent(e.target.value)}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => {
            localStorage.removeItem("adminAction");
            window.location.reload();
          }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Campaign
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewCampaignPage;