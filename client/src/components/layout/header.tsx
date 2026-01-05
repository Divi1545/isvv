import { User } from "@shared/schema";
import { useLocation, Link } from "wouter";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useApiGet } from "@/lib/api-hooks";

interface HeaderProps {
  user: Partial<User>;
  onMenuClick: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const [location] = useLocation();
  
  // Get unread notifications
  const { data: notifications } = useApiGet("/api/notifications/unread", {
    enabled: !!user,
  });
  
  const hasUnreadNotifications = (notifications?.length ?? 0) > 0;
  
  const getPageTitle = () => {
    switch (location) {
      // Admin routes
      case "/admin":
        return "Admin Dashboard";
      case "/admin/vendors":
        return "Vendor Management";
      case "/admin/bookings":
        return "Booking Management";
      case "/admin/revenue":
        return "Revenue Management";
      case "/admin/marketing":
        return "Marketing Campaigns";
      case "/admin/transactions":
        return "Transaction History";
      case "/admin/analytics":
        return "Analytics Dashboard";
      case "/admin/support":
        return "Support Dashboard";
      case "/admin/api-keys":
        return "API Keys";
      case "/admin/settings":
        return "Settings";
      // Vendor routes
      case "/dashboard":
        return "Dashboard Overview";
      case "/dashboard/bookings":
        return "Booking Manager";
      case "/dashboard/calendar":
        return "Calendar Sync";
      case "/dashboard/pricing":
        return "Pricing Engine";
      case "/dashboard/ai-marketing":
        return "AI Marketing";
      case "/dashboard/analytics":
        return "Analytics & Reports";
      case "/dashboard/profile":
        return "Profile Settings";
      case "/dashboard/notifications":
        return "Notifications & Logs";
      default:
        return user?.role === 'admin' ? "Admin Dashboard" : "Dashboard";
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm h-16 fixed right-0 left-0 md:left-64 z-10">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
          <h2 className="text-lg font-semibold text-neutral-800 ml-2 md:ml-0">
            {getPageTitle()}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Link href="/dashboard/notifications">
              <button className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 relative">
                <Bell className="h-5 w-5" />
                {hasUnreadNotifications && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </Link>
          </div>
          
          <div className="relative">
            <a 
              href="https://docs.islandloaf.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100"
            >
              <i className="ri-question-line text-xl"></i>
            </a>
          </div>
          
          <div className="border-l border-neutral-200 h-8 mx-2"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <span>{user.fullName ? getInitials(user.fullName) : "U"}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


