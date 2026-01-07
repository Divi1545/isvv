import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import VendorSignup from "@/pages/VendorSignup";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Dashboard from "@/pages/dashboard";
import BookingManager from "@/pages/dashboard/booking-manager";
import AddBooking from "./pages/dashboard/add-booking";
import CalendarSync from "@/pages/dashboard/calendar-sync";
import PricingEngine from "@/pages/dashboard/pricing-engine";
import AiMarketing from "@/pages/dashboard/ai-marketing";
import AIFeatures from "@/pages/dashboard/AIFeatures";
import AIAgentTrainer from "@/pages/dashboard/AIAgentTrainer";
import Analytics from "@/pages/dashboard/analytics";
import ProfileSettings from "@/pages/dashboard/profile-settings";
import Notifications from "@/pages/dashboard/notifications";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import VendorManagement from "@/pages/admin/VendorManagement";
import BookingManagement from "@/pages/admin/BookingManagement";
import RevenueManagement from "@/pages/admin/RevenueManagement";
import MarketingCampaigns from "@/pages/admin/MarketingCampaigns";
import TransactionHistory from "@/pages/admin/TransactionHistory";
import AnalyticsDashboard from "@/pages/admin/AnalyticsDashboard";
import SupportDashboard from "@/pages/admin/SupportDashboard";
import Settings from "@/pages/admin/Settings";
import ApiKeys from "@/pages/admin/api-keys";
import AddVendorForm from "@/pages/admin/AddVendorForm";
import { useAuth, AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { useEffect, useRef } from "react";

function Router() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-primary rounded-full border-t-transparent"></div>
    </div>;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin/login" component={Login} />
      <Route path="/vendor/login" component={Login} />
      <Route path="/vendor-signup" component={VendorSignup} />
      
      {/* Admin Dashboard routes */}
      <Route path="/admin">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/vendors">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <VendorManagement />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/bookings">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <BookingManagement />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/revenue">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <RevenueManagement />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/marketing">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <MarketingCampaigns />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/transactions">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <TransactionHistory />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/analytics">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <AnalyticsDashboard />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/support">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <SupportDashboard />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/settings">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/api-keys">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <ApiKeys />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/admin/add-vendor">
        {() => 
          user?.role === 'admin' ? (
            <DashboardLayout>
              <AddVendorForm />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      
      {/* Vendor Dashboard routes */}
      <Route path="/dashboard">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/bookings">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <BookingManager />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/add-booking">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <AddBooking />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/calendar">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <CalendarSync />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/pricing">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <PricingEngine />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/ai-marketing">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <AiMarketing />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/ai-features">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <AIFeatures />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/ai-trainer">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <AIAgentTrainer />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/analytics">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/profile">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <ProfileSettings />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      <Route path="/dashboard/notifications">
        {() => 
          user && user.role === 'vendor' ? (
            <DashboardLayout>
              <Notifications />
            </DashboardLayout>
          ) : <Login />
        }
      </Route>
      
      {/* Redirect root to dashboard or login */}
      <Route path="/">
        {() => {
          if (!user) return <Login />;
          if (user.role === 'admin') {
            return (
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            );
          } else {
            return (
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            );
          }
        }}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="islandloaf-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
