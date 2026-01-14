import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings as SettingsIcon, Users, Mail, Shield, Globe, Database, Bell, CreditCard } from 'lucide-react';

// System Settings Interface
interface SystemSettings {
  id: number;
  platformName: string;
  adminEmail: string;
  supportEmail: string;
  enableRegistration: boolean;
  defaultCommissionRate: number;
  maxVendorsPerCategory: number;
  autoApproveVendors: boolean;
  maintenanceMode: boolean;
  allowGuestBookings: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  backupFrequency: string;
  updatedAt: string;
}

// Commission Settings Component
const CommissionSettings = () => {
  const [rates, setRates] = useState({
    accommodation: 10,
    transport: 12,
    tours: 15,
    wellness: 10,
    tickets: 8,
    products: 5,
    processing: 2.5
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCommissionMutation = useMutation({
    mutationFn: async (newRates: any) => {
      const response = await apiRequest('POST', '/api/settings/commission', { rates: newRates });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Commission rates updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission rates",
        variant: "destructive"
      });
    }
  });

  const handleRateChange = (category: string, value: string) => {
    setRates(prev => ({ ...prev, [category]: parseFloat(value) || 0 }));
  };

  const handleUpdateRates = () => {
    updateCommissionMutation.mutate(rates);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Commission Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(rates).map(([category, rate]) => (
            <div key={category} className="space-y-2">
              <Label className="text-sm font-medium capitalize">
                {category.replace(/([A-Z])/g, ' $1').trim()} Rate (%)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => handleRateChange(category, e.target.value)}
                  className="pl-7"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button 
            onClick={handleUpdateRates}
            disabled={updateCommissionMutation.isPending}
            className="w-full"
          >
            {updateCommissionMutation.isPending ? 'Updating...' : 'Update Commission Rates'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// User Management Settings Component
const UserManagementSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/settings/users'],
    queryFn: async () => {
      const response = await fetch('/api/vendors');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await apiRequest('PUT', `/api/settings/users/${userId}/role`, { role });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive"
      });
    }
  });

  const handleRoleChange = (userId: number, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  if (isLoading) return <div>Loading users...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user.fullName?.[0] || user.username[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{user.fullName || user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.businessType || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
                <Select
                  value={user.role}
                  onValueChange={(role) => handleRoleChange(user.id, role)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// System Configuration Component
const SystemConfiguration = () => {
  const [settings, setSettings] = useState({
    platformName: "IslandLoaf",
    adminEmail: "admin@islandloaf.com",
    supportEmail: "support@islandloaf.com",
    enableRegistration: true,
    defaultCommissionRate: 10,
    maxVendorsPerCategory: 100,
    autoApproveVendors: false,
    maintenanceMode: false,
    allowGuestBookings: true,
    emailNotifications: true,
    smsNotifications: false,
    backupFrequency: "daily"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await apiRequest('POST', '/api/settings/system', newSettings);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "System settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update system settings",
        variant: "destructive"
      });
    }
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    updateSystemSettingsMutation.mutate(settings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={settings.platformName}
                onChange={(e) => handleSettingChange('platformName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleSettingChange('adminEmail', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCommissionRate">Default Commission Rate (%)</Label>
              <Input
                id="defaultCommissionRate"
                type="number"
                value={settings.defaultCommissionRate}
                onChange={(e) => handleSettingChange('defaultCommissionRate', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable User Registration</Label>
              <p className="text-sm text-muted-foreground">Allow new users to register on the platform</p>
            </div>
            <Switch
              checked={settings.enableRegistration}
              onCheckedChange={(checked) => handleSettingChange('enableRegistration', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-approve Vendors</Label>
              <p className="text-sm text-muted-foreground">Automatically approve vendor applications</p>
            </div>
            <Switch
              checked={settings.autoApproveVendors}
              onCheckedChange={(checked) => handleSettingChange('autoApproveVendors', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Enable maintenance mode for the platform</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Guest Bookings</Label>
              <p className="text-sm text-muted-foreground">Allow bookings without user registration</p>
            </div>
            <Switch
              checked={settings.allowGuestBookings}
              onCheckedChange={(checked) => handleSettingChange('allowGuestBookings', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Send notifications via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
            />
          </div>
          <div className="space-y-2">
            <Label>Backup Frequency</Label>
            <Select
              value={settings.backupFrequency}
              onValueChange={(value) => handleSettingChange('backupFrequency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={updateSystemSettingsMutation.isPending}
          className="w-full md:w-auto"
        >
          {updateSystemSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

// Database Management Component
const DatabaseManagement = () => {
  const { toast } = useToast();
  const [backupStatus, setBackupStatus] = useState('idle');

  const { data: dbStats, isLoading } = useQuery({
    queryKey: ['/api/settings/database/stats'],
    queryFn: async () => {
      const response = await fetch('/api/settings/database/stats');
      if (!response.ok) throw new Error('Failed to fetch database stats');
      return response.json();
    }
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/settings/database/backup', {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Database backup created successfully",
      });
      setBackupStatus('completed');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create database backup",
        variant: "destructive"
      });
      setBackupStatus('failed');
    }
  });

  const handleCreateBackup = () => {
    setBackupStatus('creating');
    createBackupMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading database statistics...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-800">{dbStats?.totalUsers || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-600">Total Bookings</p>
                <p className="text-2xl font-bold text-green-800">{dbStats?.totalBookings || 0}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-600">Active Vendors</p>
                <p className="text-2xl font-bold text-yellow-800">{dbStats?.activeVendors || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-600">Database Size</p>
                <p className="text-2xl font-bold text-purple-800">{dbStats?.databaseSize || 'N/A'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Backup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Regular backups are important for data security. The last backup was created on {new Date().toLocaleDateString()}.
              </AlertDescription>
            </Alert>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Create Database Backup</p>
                <p className="text-sm text-muted-foreground">
                  Create a full backup of the database including all user data, bookings, and settings.
                </p>
              </div>
              <Button 
                onClick={handleCreateBackup}
                disabled={createBackupMutation.isPending}
                variant={backupStatus === 'completed' ? 'default' : 'outline'}
              >
                {backupStatus === 'creating' ? 'Creating...' : 
                 backupStatus === 'completed' ? 'Backup Created' : 'Create Backup'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Settings Component
const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage platform configuration, users, and system preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <SystemConfiguration />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagementSettings />
        </TabsContent>

        <TabsContent value="commission" className="mt-6">
          <CommissionSettings />
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <DatabaseManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;