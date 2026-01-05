import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { logAuthDebug, debugLoginAttempt, debugCookieIssues } from "@/utils/auth-debug";
import type { BusinessType } from "@shared/schema";

// Define the User interface
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  businessName: string;
  businessType: BusinessType;
  role: string;
  categoriesAllowed?: string[];
}

// Define auth token and session data
interface AuthToken {
  token: string;
  expiresAt: number; // Unix timestamp when token expires
  user: User;
}

// Define the AuthContext interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => boolean; // Returns true if session is valid
  refreshSession: () => Promise<boolean>; // Returns true if refresh was successful
}

// Create mock user for development
const MOCK_USER: User = {
  id: 1,
  username: "vendor",
  email: "vendor@islandloaf.com",
  fullName: "Island Vendor",
  businessName: "Beach Paradise Villa",
  businessType: "stays",
  role: "vendor",
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants for token management
const TOKEN_KEY = 'islandloaf_auth_token';
const TOKEN_EXPIRY_DAYS = 7; // Default token expiry in days
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check session every minute

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true to check localStorage
  const { toast } = useToast();

  // Function to save auth token to localStorage
  const saveToken = (token: string, user: User, rememberMe: boolean = false) => {
    const expiryDays = rememberMe ? TOKEN_EXPIRY_DAYS : 1; // 1 day if not remember me
    const expiresAt = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
    
    const authToken: AuthToken = {
      token,
      expiresAt,
      user
    };
    
    localStorage.setItem(TOKEN_KEY, JSON.stringify(authToken));
  };

  // Function to get token from localStorage
  const getToken = (): AuthToken | null => {
    const tokenStr = localStorage.getItem(TOKEN_KEY);
    if (!tokenStr) return null;
    
    try {
      return JSON.parse(tokenStr) as AuthToken;
    } catch (e) {
      console.error('Failed to parse auth token', e);
      return null;
    }
  };

  // Function to remove token from localStorage
  const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
  };

  // Check if session is valid
  const checkSession = (): boolean => {
    const authToken = getToken();
    if (!authToken) return false;
    
    // Check if token is expired
    return authToken.expiresAt > Date.now();
  };

  // Refresh the session token
  const refreshSession = async (): Promise<boolean> => {
    const authToken = getToken();
    if (!authToken) return false;
    
    try {
      // In a real implementation, you would call the backend to refresh the token
      // For now, we'll just extend the expiry time
      const newExpiresAt = Date.now() + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      const newAuthToken: AuthToken = {
        ...authToken,
        expiresAt: newExpiresAt
      };
      
      localStorage.setItem(TOKEN_KEY, JSON.stringify(newAuthToken));
      return true;
    } catch (error) {
      console.error('Failed to refresh session', error);
      return false;
    }
  };

  // Load user from session on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        logAuthDebug('Loading user session on mount');
        debugCookieIssues();
        
        // Check if user is authenticated with backend
        const response = await fetch('/api/me', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          logAuthDebug('User loaded successfully from backend');
        } else {
          logAuthDebug('Backend authentication failed, checking localStorage');
          // Clear any old localStorage data and force login
          setUser(null);
          removeToken();
          logAuthDebug('No valid session found, cleared localStorage');
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
        logAuthDebug('Error loading user session: ' + (error as Error).message);
        setUser(null);
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
    
    // Set up periodic session check - only if user is logged in
    const intervalId = setInterval(async () => {
      if (user) {
        try {
          const response = await fetch('/api/me', {
            credentials: 'include'
          });
          
          if (!response.ok) {
            setUser(null);
            removeToken();
            toast({
              title: "Session expired",
              description: "Your session has expired. Please log in again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Session check failed:', error);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Handle window close/refresh - logout user for security
    const handleBeforeUnload = () => {
      if (user) {
        navigator.sendBeacon('/api/logout');
      }
    };

    // Handle tab visibility change - logout if hidden too long
    const handleVisibilityChange = () => {
      if (document.hidden && user) {
        setTimeout(() => {
          if (document.hidden) {
            logout();
          }
        }, 30000); // 30 seconds
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [toast, user]);

  // Login function - makes API call to authenticate with backend
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      logAuthDebug('Starting login attempt');
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        debugLoginAttempt(email, false, errorData.error);
        throw new Error(errorData.error || 'Login failed');
      }
      
      const userData = await response.json();
      debugLoginAttempt(email, true);
      
      // Set user data immediately
      setUser(userData.user);
      logAuthDebug('User set after successful login');
      
      // Save token to localStorage if remember me is checked
      if (rememberMe && userData.token) {
        saveToken(userData.token, userData.user, rememberMe);
        logAuthDebug('Token saved to localStorage');
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call backend logout endpoint
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Remove token from localStorage
      removeToken();
      
      // Update state
      setUser(null);
      
      // Clear all query cache
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Using createElement instead of JSX for compatibility
  return React.createElement(
    AuthContext.Provider,
    { value: { user, isLoading, login, logout, checkSession, refreshSession } },
    children
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}