import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Mail, MessageCircle, Calendar, Users, BarChart3, Eye, MousePointer, Send, Edit, Trash2, Copy } from 'lucide-react';

interface Campaign {
  id: number;
  title: string;
  type: 'email' | 'sms' | 'push' | 'social';
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  message: string;
  startDate?: string;
  endDate?: string;
  targetAudience: 'all' | 'vendors' | 'customers' | 'inactive';
  promoCode?: string;
  discount?: number;
  sent: number;
  opened: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
}

interface NewCampaign {
  title: string;
  type: 'email' | 'sms' | 'push' | 'social';
  message: string;
  startDate: string;
  endDate: string;
  targetAudience: 'all' | 'vendors' | 'customers' | 'inactive';
  promoCode?: string;
  discount?: number;
}

const MarketingCampaigns = () => {
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [quickEmailData, setQuickEmailData] = useState({
    title: '',
    message: '',
    audience: 'all'
  });
  const [promoCodeData, setPromoCodeData] = useState({
    code: '',
    discount: '',
    validUntil: ''
  });

  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    title: '',
    type: 'email',
    message: '',
    startDate: '',
    endDate: '',
    targetAudience: 'all',
    promoCode: '',
    discount: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns from API
  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['/api/campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      return response.json();
    }
  });

  // Fetch active campaigns
  const { data: activeCampaigns } = useQuery({
    queryKey: ['/api/campaigns/active'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns/active');
      if (!response.ok) {
        throw new Error('Failed to fetch active campaigns');
      }
      return response.json();
    }
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: NewCampaign) => {
      const response = await apiRequest('POST', '/api/campaigns', campaign);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      // Invalidate both campaigns queries to ensure UI refreshes
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active'] });
      setIsNewCampaignOpen(false);
      resetNewCampaignForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive"
      });
    }
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<NewCampaign>) => {
      const response = await apiRequest('PUT', `/api/campaigns/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      // Invalidate both campaigns queries to ensure UI refreshes
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active'] });
      setIsEditMode(false);
      setSelectedCampaign(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive"
      });
    }
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/campaigns/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      // Invalidate both campaigns queries to ensure UI refreshes
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive"
      });
    }
  });

  // Launch campaign mutation
  const launchCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/campaigns/${id}/launch`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign launched successfully",
      });
      // Invalidate both campaigns queries to ensure UI refreshes
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to launch campaign",
        variant: "destructive"
      });
    }
  });

  // Send quick email blast mutation
  const sendQuickEmailMutation = useMutation({
    mutationFn: async (emailData: typeof quickEmailData) => {
      const response = await apiRequest('POST', '/api/campaigns/quick-email', emailData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email blast sent successfully",
      });
      setQuickEmailData({ title: '', message: '', audience: 'all' });
      // Refresh campaign data to show updated statistics
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email blast",
        variant: "destructive"
      });
    }
  });

  // Generate promo code mutation
  const generatePromoCodeMutation = useMutation({
    mutationFn: async (promoData: typeof promoCodeData) => {
      const response = await apiRequest('POST', '/api/campaigns/promo-code', promoData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Promo code ${data.code} created successfully`,
      });
      setPromoCodeData({ code: '', discount: '', validUntil: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate promo code",
        variant: "destructive"
      });
    }
  });

  const resetNewCampaignForm = () => {
    setNewCampaign({
      title: '',
      type: 'email',
      message: '',
      startDate: '',
      endDate: '',
      targetAudience: 'all',
      promoCode: '',
      discount: 0
    });
  };

  const handleCreateCampaign = () => {
    if (!newCampaign.title || !newCampaign.message) {
      toast({
        title: "Missing information",
        description: "Please fill in campaign title and message",
        variant: "destructive"
      });
      return;
    }

    createCampaignMutation.mutate(newCampaign);
  };

  const handleUpdateCampaign = () => {
    if (!selectedCampaign) return;

    updateCampaignMutation.mutate({
      id: selectedCampaign.id,
      ...newCampaign
    });
  };

  const handleDeleteCampaign = (id: number) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaignMutation.mutate(id);
    }
  };

  const handleLaunchCampaign = (id: number) => {
    if (window.confirm('Are you sure you want to launch this campaign?')) {
      launchCampaignMutation.mutate(id);
    }
  };

  const handleSendQuickEmail = () => {
    if (!quickEmailData.title || !quickEmailData.message) {
      toast({
        title: "Missing information",
        description: "Please fill in email title and message",
        variant: "destructive"
      });
      return;
    }

    sendQuickEmailMutation.mutate(quickEmailData);
  };

  const handleGeneratePromoCode = () => {
    if (!promoCodeData.code || !promoCodeData.discount) {
      toast({
        title: "Missing information",
        description: "Please enter promo code and discount percentage",
        variant: "destructive"
      });
      return;
    }

    generatePromoCodeMutation.mutate(promoCodeData);
  };

  const generateRandomPromoCode = () => {
    const randomCode = 'PROMO' + Math.random().toString(36).substr(2, 5).toUpperCase();
    setPromoCodeData({ ...promoCodeData, code: randomCode });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageCircle className="h-4 w-4" />;
      case 'push': return <Send className="h-4 w-4" />;
      case 'social': return <Users className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load campaigns</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage marketing campaigns to engage your audience
          </p>
        </div>
        <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Title</Label>
                  <Input
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                    placeholder="Summer Beach Special"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campaign Type</Label>
                  <Select 
                    value={newCampaign.type} 
                    onValueChange={(value: 'email' | 'sms' | 'push' | 'social') => 
                      setNewCampaign({ ...newCampaign, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                  placeholder="Enter your marketing message..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select 
                    value={newCampaign.targetAudience} 
                    onValueChange={(value: 'all' | 'vendors' | 'customers' | 'inactive') => 
                      setNewCampaign({ ...newCampaign, targetAudience: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="vendors">Vendors Only</SelectItem>
                      <SelectItem value="customers">Customers Only</SelectItem>
                      <SelectItem value="inactive">Inactive Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Promo Code (Optional)</Label>
                  <Input
                    value={newCampaign.promoCode}
                    onChange={(e) => setNewCampaign({ ...newCampaign, promoCode: e.target.value })}
                    placeholder="SUMMER25"
                  />
                </div>
              </div>

              {newCampaign.promoCode && (
                <div className="space-y-2">
                  <Label>Discount Percentage</Label>
                  <Input
                    type="number"
                    value={newCampaign.discount}
                    onChange={(e) => setNewCampaign({ ...newCampaign, discount: parseInt(e.target.value) || 0 })}
                    placeholder="10"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewCampaignOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={isEditMode ? handleUpdateCampaign : handleCreateCampaign}
                  disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
                >
                  {createCampaignMutation.isPending || updateCampaignMutation.isPending ? 
                    'Saving...' : 
                    (isEditMode ? 'Update Campaign' : 'Create Campaign')
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns?.length || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{activeCampaigns?.length || 0}</p>
              </div>
              <Send className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">
                  {campaigns?.reduce((sum: number, c: Campaign) => sum + c.sent, 0) || 0}
                </p>
              </div>
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Open Rate</p>
                <p className="text-2xl font-bold">
                  {campaigns?.length ? 
                    Math.round(campaigns.reduce((sum: number, c: Campaign) => 
                      sum + (c.sent > 0 ? (c.opened / c.sent) * 100 : 0), 0
                    ) / campaigns.length) : 0}%
                </p>
              </div>
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Email Blast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Quick Email Blast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Title</Label>
              <Input
                value={quickEmailData.title}
                onChange={(e) => setQuickEmailData({ ...quickEmailData, title: e.target.value })}
                placeholder="Important Update"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={quickEmailData.message}
                onChange={(e) => setQuickEmailData({ ...quickEmailData, message: e.target.value })}
                placeholder="Your message here..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select 
                value={quickEmailData.audience} 
                onValueChange={(value) => setQuickEmailData({ ...quickEmailData, audience: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="vendors">Vendors Only</SelectItem>
                  <SelectItem value="customers">Customers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleSendQuickEmail}
              disabled={sendQuickEmailMutation.isPending}
              className="w-full"
            >
              {sendQuickEmailMutation.isPending ? 'Sending...' : 'Send Email Blast'}
            </Button>
          </CardContent>
        </Card>

        {/* Promo Code Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Promo Code Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Promo Code</Label>
              <div className="flex gap-2">
                <Input
                  value={promoCodeData.code}
                  onChange={(e) => setPromoCodeData({ ...promoCodeData, code: e.target.value })}
                  placeholder="SUMMER25"
                />
                <Button variant="outline" onClick={generateRandomPromoCode}>
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input
                type="number"
                value={promoCodeData.discount}
                onChange={(e) => setPromoCodeData({ ...promoCodeData, discount: e.target.value })}
                placeholder="10"
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={promoCodeData.validUntil}
                onChange={(e) => setPromoCodeData({ ...promoCodeData, validUntil: e.target.value })}
              />
            </div>
            <Button 
              onClick={handleGeneratePromoCode}
              disabled={generatePromoCodeMutation.isPending}
              className="w-full"
            >
              {generatePromoCodeMutation.isPending ? 'Creating...' : 'Create Promo Code'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns?.map((campaign: Campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(campaign.type)}
                    <div>
                      <h3 className="font-medium">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {campaign.targetAudience === 'all' ? 'All Users' : 
                         campaign.targetAudience.charAt(0).toUpperCase() + campaign.targetAudience.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Sent: {campaign.sent}</span>
                    <span>•</span>
                    <span>Opens: {campaign.opened}</span>
                    <span>•</span>
                    <span>Clicks: {campaign.clicks}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleLaunchCampaign(campaign.id)}
                        disabled={launchCampaignMutation.isPending}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Launch
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setNewCampaign({
                          title: campaign.title,
                          type: campaign.type,
                          message: campaign.message,
                          startDate: campaign.startDate || '',
                          endDate: campaign.endDate || '',
                          targetAudience: campaign.targetAudience,
                          promoCode: campaign.promoCode || '',
                          discount: campaign.discount || 0
                        });
                        setIsEditMode(true);
                        setIsNewCampaignOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      disabled={deleteCampaignMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {(!campaigns || campaigns.length === 0) && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No campaigns found. Create your first campaign to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingCampaigns;