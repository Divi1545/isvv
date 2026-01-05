import React from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import AiAssistant from "@/components/dashboard/ai-assistant";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  const [, setLocation] = useLocation();
  
  if (!user) {
    // Redirect to login
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onOpenChange={setSidebarOpen} 
        user={user}
      />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        <Header 
          user={user}
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        {/* Content Area */}
        <main className="pt-20 pb-8 px-4 md:px-6">
          {children}
          
          {/* AI Assistant */}
          <AiAssistant />
        </main>
      </div>
    </div>
  );
}
