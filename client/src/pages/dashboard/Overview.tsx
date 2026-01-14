import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import StatCard from "@/components/dashboard/stat-card";
import RevenueChart from "@/components/dashboard/revenue-chart";
import ServiceBreakdown from "@/components/dashboard/service-breakdown";

// Sample data for the overview page
const revenueData = [
  { date: "Jan", revenue: 2400 },
  { date: "Feb", revenue: 3000 },
  { date: "Mar", revenue: 2800 },
  { date: "Apr", revenue: 3600 },
  { date: "May", revenue: 4200 },
  { date: "Jun", revenue: 4800 }
];

const serviceTypes = [
  {
    type: "Accommodation",
    percentage: 45,
    icon: "building",
    color: { bg: "bg-blue-100", text: "text-blue-700" }
  },
  {
    type: "Vehicle Rental",
    percentage: 25,
    icon: "car",
    color: { bg: "bg-green-100", text: "text-green-700" }
  },
  {
    type: "Tours",
    percentage: 18,
    icon: "map",
    color: { bg: "bg-amber-100", text: "text-amber-700" }
  },
  {
    type: "Wellness",
    percentage: 12,
    icon: "heart",
    color: { bg: "bg-rose-100", text: "text-rose-700" }
  }
];

// Mock user data
const mockUser = {
  id: 1,
  username: "vendor",
  email: "vendor@islandloaf.com",
  fullName: "Island Vendor",
  businessName: "Beach Paradise Villa",
  businessType: "accommodation",
  role: "vendor"
};

const Overview = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
      
      {/* Welcome alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
          </svg> 
          Welcome back, {mockUser.fullName}!
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          Your {mockUser.businessType} business has 3 new bookings since your last login. Check your upcoming schedule below.
        </AlertDescription>
      </Alert>
      
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue"
          value="$12,628"
          icon="dollar-sign"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{ value: "+12.5%", isPositive: true }}
          subtitle="vs. last month"
        />
        <StatCard 
          title="Bookings"
          value="237"
          icon="calendar"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{ value: "+8.2%", isPositive: true }}
          subtitle="vs. last month"
        />
        <StatCard 
          title="Avg. Rating"
          value="4.8"
          icon="star"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          trend={{ value: "+0.3", isPositive: true }}
          subtitle="vs. last month"
        />
        <StatCard 
          title="Conversion Rate"
          value="28.5%"
          icon="percent"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={{ value: "-2.1%", isPositive: false }}
          subtitle="vs. last month"
        />
      </div>
      
      {/* Revenue chart & Service breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Revenue Trend</h3>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Service Breakdown</h3>
            <ServiceBreakdown services={serviceTypes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;