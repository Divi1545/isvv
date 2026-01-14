import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Building2, MapPin, Mail, Lock, User } from "lucide-react";

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.enum(["stays", "vehicles", "tours", "wellness", "tickets", "products"]),
  location: z.string().min(2, "Location is required"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function VendorRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      businessName: "",
      businessType: "stays",
      location: "Colombo, Sri Lanka"
    }
  });

  const onSubmit = async (data: RegistrationForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/vendor/register", data);
      const result = await response.json();

      if (result.success) {
        setRegistrationSuccess(true);
        if (result.password) {
          setGeneratedPassword(result.password);
        }
        toast({
          title: "Registration Successful",
          description: "Your vendor account has been created successfully!",
        });
      } else {
        throw new Error(result.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Welcome to IslandLoaf!</CardTitle>
            <CardDescription>Your vendor account has been created successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedPassword && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Your temporary password:
                </p>
                <code className="text-sm bg-yellow-100 px-2 py-1 rounded font-mono">
                  {generatedPassword}
                </code>
                <p className="text-xs text-yellow-700 mt-2">
                  Please save this password and change it after your first login.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => window.location.href = '/vendor/login'}
              >
                Continue to Login
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setRegistrationSuccess(false);
                  form.reset();
                }}
              >
                Register Another Vendor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Join IslandLoaf</CardTitle>
          <CardDescription>
            Create your vendor account to start managing your tourism business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 6 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Business Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Paradise Hotel & Resort" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stays">Accommodation & Stays</SelectItem>
                        <SelectItem value="vehicles">Vehicle Rentals</SelectItem>
                        <SelectItem value="tours">Tours & Activities</SelectItem>
                        <SelectItem value="wellness">Wellness & Spa</SelectItem>
                        <SelectItem value="tickets">Tickets & Events</SelectItem>
                        <SelectItem value="products">Products & Souvenirs</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Colombo, Sri Lanka" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Vendor Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/vendor/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in here
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}