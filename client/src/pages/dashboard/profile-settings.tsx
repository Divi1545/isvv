import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { changePassword, fetchAuthMe, updateUserProfile } from "@/lib/api";
import { Building, CreditCard, Lock, Upload, User } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { businessTypes } from "@shared/schema";
import { useApiQuery } from "@/lib/api-hooks";

const profileFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  businessType: z.enum(businessTypes, {
    required_error: "Please select a business type.",
  }),
  description: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Current password is required.",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(1, {
    message: "Please confirm your new password.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfileSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch current user data
  const { data: currentUser, isLoading: userLoading } = useApiQuery({
    key: ["/api/auth/me"] as const,
    fn: async () => fetchAuthMe(),
    options: { refetchInterval: 30000 },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileFormValues>) => {
      return updateUserProfile(data, queryClient);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      // Refetch user data to update the form
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      return changePassword(currentPassword, newPassword);
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to change password",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: currentUser?.fullName || user?.fullName || "",
      email: currentUser?.email || user?.email || "",
      businessName: currentUser?.businessName || user?.businessName || "",
      businessType: currentUser?.businessType ?? user?.businessType ?? businessTypes[0],
      description: "",
    },
  });
  
  // Update form when user data changes
  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        businessName: currentUser.businessName || "",
        businessType: currentUser.businessType ?? businessTypes[0],
        description: "",
      });
    }
  }, [currentUser, profileForm]);
  
  // Password form setup
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  function onProfileSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data);
  }
  
  function onPasswordSubmit(data: PasswordFormValues) {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Profile Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl">
                          {user?.fullName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <h3 className="font-medium">{user?.fullName || "User"}</h3>
                          <p className="text-sm text-neutral-500">{user?.email || "user@example.com"}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full md:w-auto">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </Button>
                    </div>
                    
                    <div className="grid gap-6 pt-4">
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Business Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Manage your business details visible to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            This is the name that will be displayed to customers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your business to customers..." 
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This will appear on your public listing page
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <Label>Business Address</Label>
                      <div className="grid gap-4">
                        <Input placeholder="Street Address" />
                        <div className="grid grid-cols-2 gap-4">
                          <Input placeholder="City" />
                          <Input placeholder="State/Province" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input placeholder="Postal Code" />
                          <Input placeholder="Country" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Business Info"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Methods Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage how you receive payments from IslandLoaf
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">Bank Transfer</h3>
                        <p className="text-sm text-neutral-500">••••3456 • Primary</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-6 border-dashed text-center">
                  <CreditCard className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
                  <h3 className="font-medium mb-1">Add Payment Method</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Add a bank account or payment method to receive payouts
                  </p>
                  <Button>Add Payment Method</Button>
                </div>
                
                <div className="pt-4">
                  <h3 className="font-medium mb-4">Payout Schedule</h3>
                  <div className="flex items-center border rounded-md p-4">
                    <div className="mr-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <i className="ri-calendar-check-line text-lg"></i>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Weekly Payouts</p>
                      <p className="text-sm text-neutral-500">Payments are sent every Friday</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      Change
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 6 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end mt-6">
                        <Button 
                          type="submit" 
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between border rounded-md p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-3">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-neutral-500">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="font-medium mb-4">Account Actions</h3>
                  <div className="flex justify-end">
                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
