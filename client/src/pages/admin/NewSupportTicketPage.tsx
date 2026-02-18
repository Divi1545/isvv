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

// New Support Ticket creation page
const NewSupportTicketPage = () => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [ticketVendor, setTicketVendor] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const { toast } = useToast();

  // Sample vendors list for demo
  const vendors = [
    { id: 'V-1001', name: 'Beach Paradise Villa' },
    { id: 'V-1002', name: 'Island Adventures' },
    { id: 'V-1003', name: 'Coastal Scooters' },
    { id: 'V-1004', name: 'Serenity Spa' },
    { id: 'V-1005', name: 'Mountain Retreat' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketSubject || !ticketMessage || !ticketVendor) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would save the ticket to the database
    toast({
      title: "Support ticket created",
      description: `Ticket has been created and assigned to the support team`
    });
    
    // Go back to the support dashboard
    localStorage.removeItem("adminAction");
    window.location.reload();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Create Support Ticket</h1>
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
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>Create a new support ticket for a vendor or system issue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject*</label>
                <Input 
                  placeholder="Brief description of the issue" 
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Related Vendor*</label>
                <Select value={ticketVendor} onValueChange={setTicketVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System Issue (No vendor)</SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category*</label>
                <Select value={ticketCategory} onValueChange={setTicketCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing/Payment</SelectItem>
                    <SelectItem value="content">Content/Listing</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="account">Account Access</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority*</label>
                <Select value={ticketPriority} onValueChange={setTicketPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ticket Details*</label>
              <Textarea 
                placeholder="Detailed description of the issue..." 
                rows={6}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Internal Notes (Not visible to vendor)</label>
              <Textarea 
                placeholder="Add any internal notes here..." 
                rows={3}
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
            Create Ticket
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewSupportTicketPage;