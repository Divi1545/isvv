import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";

interface LoginPageProps {
  onLoginSuccess: (role: string) => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.includes('/admin/login') ? 'admin' : 'vendor'
  );
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: `${result.user.role === 'admin' ? 'Admin' : 'Vendor'} login successful`,
          description: "Welcome to IslandLoaf Dashboard",
        });
        
        // Redirect based on user role
        if (result.user.role === 'admin') {
          setLocation('/admin');
        } else {
          setLocation('/dashboard');
        }
        
        onLoginSuccess(result.user.role);
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid email or password. Please register first if you're a vendor.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mr-2">
            <span className="text-white font-bold text-xl">IL</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">IslandLoaf</h1>
        </div>
        <p className="text-slate-600">Tourism Management Platform</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard
          </CardDescription>
          <Tabs 
            defaultValue="vendor" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full mt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vendor">Vendor Login</TabsTrigger>
              <TabsTrigger value="admin">Admin Login</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder={activeTab === 'vendor' ? "vendor@islandloaf.com" : "admin@islandloaf.com"} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-emerald-600 hover:text-emerald-500">
                  Forgot password?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="remember" className="text-sm text-gray-700">
                Remember me
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className={`w-full ${activeTab === 'vendor' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'}`} 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-6 text-center text-sm text-slate-600">
        <div className="mb-4">
          <p className="mb-2">Don't have an account?</p>
          <Link href="/vendor-signup">
            <Button variant="outline" className="mx-auto">
              Register as Vendor
            </Button>
          </Link>
        </div>
        <div className="mb-2">Contact Support:</div>
        <div className="flex justify-center">
          <code className="bg-blue-100 px-3 py-2 rounded text-blue-700">info@islandloafvendor.com</code>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;