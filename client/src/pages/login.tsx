import LoginForm from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Store, TrendingUp, Shield, Zap } from "lucide-react";
import logoImage from "@assets/output-onlinepngtools_1753247305728.png";

export default function Login() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-blue-600 to-cyan-600 p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <img 
              src={logoImage} 
              alt="IslandLoaf Logo" 
              className="h-12 w-auto"
            />
            <h1 className="text-2xl font-bold">IslandLoaf</h1>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              Grow your tourism business with Sri Lanka's leading platform
            </h2>
            <p className="text-lg text-blue-100">
              Join 1,000+ vendors managing bookings, pricing, and marketing all in one place.
            </p>
            
            <div className="space-y-4 pt-6">
              {[
                { icon: Store, title: "Easy Booking Management", desc: "Track all reservations in real-time" },
                { icon: TrendingUp, title: "Smart Analytics", desc: "Grow revenue with data insights" },
                { icon: Zap, title: "AI-Powered Marketing", desc: "Generate content automatically" },
                { icon: Shield, title: "Secure & Reliable", desc: "Bank-level security for your data" },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-blue-100">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-sm text-blue-100">
          © 2024 IslandLoaf. Trusted by Sri Lanka's top tourism businesses.
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <img 
              src={logoImage} 
              alt="IslandLoaf Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-2xl font-bold">IslandLoaf</h1>
          </div>
          
          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your vendor dashboard to manage your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/vendor-signup">
                  <span className="font-semibold text-primary hover:underline cursor-pointer">
                    Sign up as Vendor
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Vendor CTA - Compact version */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-cyan-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Store className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">New to IslandLoaf?</h3>
                  <p className="text-sm text-muted-foreground">
                    Join our vendor network in minutes
                  </p>
                </div>
                <Link href="/vendor-signup">
                  <Button variant="outline" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Contact info */}
          <div className="text-center text-xs text-muted-foreground">
            <p>Need help? Contact us at <a href="mailto:info@islandloafvendor.com" className="text-primary hover:underline">info@islandloafvendor.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
