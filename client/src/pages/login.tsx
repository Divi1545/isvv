import LoginForm from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoImage from "@assets/output-onlinepngtools_1753247305728.png";

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 py-8 overflow-y-auto">
      <div className="max-w-md w-full mx-auto px-4 space-y-6">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <img 
                  src={logoImage} 
                  alt="Logo" 
                  className="h-96 w-auto max-w-full"
                />
              </div>
              <p className="text-gray-600">Tourism Management Platform</p>
            </div>
            
            <LoginForm />
            
            {/* Vendor Sign Up Link */}
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <Link href="/vendor-signup">
                <span className="text-blue-600 font-medium hover:underline cursor-pointer">
                  Sign up as Vendor
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Vendor Signup Call-to-Action */}
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Join as a Vendor</h3>
            <p className="text-green-100 mb-4 text-sm">
              List your business and connect with travelers across Sri Lanka
            </p>
            <Link href="/vendor-signup">
              <Button className="w-full bg-white text-green-600 hover:bg-gray-50 font-medium">
                <i className="ri-store-line mr-2"></i>
                Become a Vendor
              </Button>
            </Link>
            <p className="text-xs text-green-100 mt-2">
              Join 1,000+ tourism businesses • No setup fees
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
