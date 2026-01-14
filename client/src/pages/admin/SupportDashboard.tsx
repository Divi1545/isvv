import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SupportTicket } from "@shared/schema";
import { MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";

const SupportDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch support tickets
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/support/tickets'],
    queryFn: async () => {
      const response = await fetch('/api/support/tickets', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }
      return response.json();
    }
  });

  // Create support ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create support ticket');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Support ticket created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update support ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await fetch(`/api/support/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update support ticket');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Support ticket updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter tickets based on search and status
  const filteredTickets = tickets.filter((ticket: SupportTicket) => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get ticket statistics
  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t: SupportTicket) => t.status === 'open').length,
    inProgress: tickets.filter((t: SupportTicket) => t.status === 'in_progress').length,
    resolved: tickets.filter((t: SupportTicket) => t.status === 'resolved').length,
    highPriority: tickets.filter((t: SupportTicket) => t.priority === 'high').length,
  };

  // Reply Dialog Component
  const ReplyDialog = ({ ticket }: { ticket: SupportTicket }) => {
    const [replyMessage, setReplyMessage] = useState('');
    const [internalNotes, setInternalNotes] = useState(ticket.internalNotes || '');
    const [ticketStatus, setTicketStatus] = useState(ticket.status);
    const [ticketPriority, setTicketPriority] = useState(ticket.priority);

    const handleSendReply = () => {
      if (!replyMessage.trim()) {
        toast({
          title: "Missing information",
          description: "Please enter a reply message",
          variant: "destructive"
        });
        return;
      }

      updateTicketMutation.mutate({
        id: ticket.id,
        updates: {
          status: ticketStatus,
          priority: ticketPriority,
          internalNotes: internalNotes,
          assignedTo: 'Admin'
        }
      });

      // Reset form
      setReplyMessage('');
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Reply
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reply to Support Ticket #{ticket.id}</DialogTitle>
            <DialogDescription>
              Respond to the support ticket and update its status
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{ticket.vendorName}</span>
                <span className="text-xs text-slate-500">
                  {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "N/A"}
                </span>
              </div>
              <h4 className="text-sm font-medium mb-2">{ticket.subject}</h4>
              <p className="text-sm">{ticket.message}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Your Reply</label>
              <Textarea 
                placeholder="Type your reply here..."
                rows={5}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={ticketStatus} onValueChange={setTicketStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select value={ticketPriority} onValueChange={setTicketPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Internal Notes (not visible to vendor)</label>
              <Textarea 
                placeholder="Add internal notes here..."
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              onClick={handleSendReply}
              disabled={updateTicketMutation.isPending}
            >
              {updateTicketMutation.isPending ? 'Updating...' : 'Send Reply & Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Create Ticket Dialog
  const CreateTicketDialog = () => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleCreateTicket = () => {
      if (!subject.trim() || !message.trim() || !category) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      createTicketMutation.mutate({
        subject: subject.trim(),
        message: message.trim(),
        priority,
        category
      });

      // Reset form on success
      setSubject('');
      setMessage('');
      setPriority('medium');
      setCategory('');
      setIsOpen(false);
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            <MessageSquare className="w-4 h-4 mr-2" />
            Create Support Ticket
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
            <DialogDescription>
              Create a new support ticket for vendor assistance
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Subject *</label>
              <Input
                placeholder="Brief description of the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Message *</label>
              <Textarea 
                placeholder="Detailed description of the issue..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category *</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              onClick={handleCreateTicket}
              disabled={createTicketMutation.isPending}
            >
              {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Support Dashboard</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Support Dashboard</h1>
        <CreateTicketDialog />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {ticketStats.total}
              </div>
              <div className="text-sm text-slate-500">Total Tickets</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {ticketStats.open}
              </div>
              <div className="text-sm text-slate-500">Open</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {ticketStats.inProgress}
              </div>
              <div className="text-sm text-slate-500">In Progress</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {ticketStats.resolved}
              </div>
              <div className="text-sm text-slate-500">Resolved</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {ticketStats.highPriority}
              </div>
              <div className="text-sm text-slate-500">High Priority</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Tabs 
        defaultValue="all" 
        value={statusFilter}
        onValueChange={setStatusFilter}
      >
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <CardTitle>Support Tickets</CardTitle>
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[300px]"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Vendor</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Subject</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Priority</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredTickets.map((ticket: SupportTicket) => (
                      <tr key={ticket.id}>
                        <td className="px-4 py-3 text-sm font-mono">#{ticket.id}</td>
                        <td className="px-4 py-3 text-sm">{ticket.vendorName}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">{ticket.subject}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[250px]">
                            {ticket.message}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="secondary">
                            {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge className={`${
                            ticket.status === 'open' ? 'bg-purple-100 text-purple-800' :
                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {ticket.status === 'in_progress' ? 'In Progress' : 
                              ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge className={`${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <ReplyDialog ticket={ticket} />
                            
                            {ticket.status !== 'resolved' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateTicketMutation.mutate({
                                  id: ticket.id,
                                  updates: { status: 'resolved' }
                                })}
                                disabled={updateTicketMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTickets.length === 0 && (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No support tickets found
                  </h3>
                  <p className="text-sm text-slate-500">
                    {searchQuery ? 'No tickets match your search criteria.' : 'No support tickets have been created yet.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default SupportDashboard;