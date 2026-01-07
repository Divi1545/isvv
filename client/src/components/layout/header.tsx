import { User } from "@shared/schema";
import { useLocation, Link } from "wouter";
import { Bell, Menu, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useApiGet } from "@/lib/api-hooks";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user: Partial<User>;
  onMenuClick: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const [location] = useLocation();
  
  // Get unread notifications
  const { data: notifications } = useApiGet<any[]>("/api/notifications/unread", {
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

  const { logout } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold tracking-tight">
            {getPageTitle()}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {hasUnreadNotifications && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
          </Link>
          
          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="Help documentation"
          >
            <a 
              href="https://docs.islandloaf.com" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <HelpCircle className="h-5 w-5" />
            </a>
          </Button>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          <div className="h-6 w-px bg-border" />
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.fullName ? getInitials(user.fullName) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications">Notifications</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}


