import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Navigation() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  const handleMobileNavigation = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false);
  };

  // Placeholder for handleLogout and isAuthenticated, assuming they are defined elsewhere or will be added.
  // For this example, we'll assume they exist and are correctly typed.
  const isAuthenticated = user !== null; // Assuming user being null means not authenticated
  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button
                onClick={() => setLocation('/')}
                className="text-2xl font-bold text-primary"
                data-testid="link-home"
              >
                GmailMarket
              </button>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <button
                  onClick={() => setLocation('/')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/')
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  data-testid="link-browse"
                >
                  Browse
                </button>
                <button
                  onClick={() => setLocation('/sell')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/sell')
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  data-testid="link-sell"
                >
                  Sell
                </button>
                <button
                  onClick={() => setLocation('/dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  data-testid="link-dashboard"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setLocation('/my-purchases')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/my-purchases')
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  data-testid="link-my-purchases"
                >
                  My Purchases
                </button>
                <button
                  onClick={() => setLocation('/profile')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/profile')
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  data-testid="link-profile"
                >
                  Profile
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Welcome,</span>
                <span className="font-medium text-foreground" data-testid="text-user-name">
                  {user?.firstName || user?.fullName || 'User'}
                </span>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <div>
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-semibold text-primary ml-1" data-testid="text-balance">
                  ${user?.balance || '0.00'}
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <NotificationDropdown />
            </div>
            <Button
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
              className="hidden md:inline-flex"
            >
              Logout
            </Button>

            {/* Mobile notification button */}
            <div className="md:hidden">
              <NotificationDropdown />
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`md:hidden fixed top-0 right-0 z-50 h-full w-64 bg-card border-l border-border transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="text-xl font-bold text-primary">GmailMarket</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted"
              data-testid="button-close-mobile-menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile navigation links */}
          <div className="flex flex-col flex-1 p-4 space-y-2">
            <button
              onClick={() => handleMobileNavigation('/')}
              className={`px-3 py-2 rounded-md text-left font-medium ${
                isActive('/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              data-testid="mobile-link-browse"
            >
              Browse
            </button>
            <button
              onClick={() => handleMobileNavigation('/sell')}
              className={`px-3 py-2 rounded-md text-left font-medium ${
                isActive('/sell')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              data-testid="mobile-link-sell"
            >
              Sell
            </button>
            <button
              onClick={() => handleMobileNavigation('/dashboard')}
              className={`px-3 py-2 rounded-md text-left font-medium ${
                isActive('/dashboard')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              data-testid="mobile-link-dashboard"
            >
              Dashboard
            </button>
            <button
              onClick={() => handleMobileNavigation('/my-purchases')}
              className={`px-3 py-2 rounded-md text-left font-medium ${
                isActive('/my-purchases')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              data-testid="mobile-link-my-purchases"
            >
              My Purchases
            </button>
            <button
              onClick={() => handleMobileNavigation('/profile')}
              className={`px-3 py-2 rounded-md text-left font-medium ${
                isActive('/profile')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              data-testid="mobile-link-profile"
            >
              Profile
            </button>
            <button
              onClick={() => handleMobileNavigation('/terms')}
              className={`px-3 py-2 rounded-md text-left font-medium ${
                isActive('/terms')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              data-testid="mobile-link-terms"
            >
              Terms
            </button>
          </div>

          {/* Mobile footer with balance and logout */}
          <div className="p-4 border-t border-border space-y-4">
            <div className="text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">Welcome, </span>
                <span className="font-medium text-foreground" data-testid="mobile-text-user-name">
                  {user?.firstName || user?.fullName || 'User'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-semibold text-primary ml-1" data-testid="mobile-text-balance">
                  ${user?.balance || '0.00'}
                </span>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = '/api/logout'}
              data-testid="mobile-button-logout"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}