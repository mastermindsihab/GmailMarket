import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  Wallet,
  Settings,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { logout, isLoggingOut } = useAdminAuth();

  // Get the relative path within the admin section
  const adminBasePath = "/sb-mail-admin";
  const relativePath = location.replace(adminBasePath, "") || "/";

  const menuItems = [
    {
      title: "Dashboard",
      href: "/sb-mail-admin",
      icon: LayoutDashboard,
      active: relativePath === "/" || relativePath === "",
    },
    {
      title: "Users",
      href: "/sb-mail-admin/users",
      icon: Users,
      active: relativePath.startsWith("/users"),
    },
    {
      title: "Categories",
      href: "/sb-mail-admin/categories",
      icon: Package,
      active: relativePath.startsWith("/categories"),
    },
    {
      title: "Transactions",
      href: "/sb-mail-admin/transactions",
      icon: ShoppingCart,
      active: relativePath.startsWith("/transactions"),
    },
    {
      title: "Deposits",
      href: "/sb-mail-admin/deposits",
      icon: DollarSign,
      active: relativePath.startsWith("/deposits"),
    },
    {
      title: "Withdrawals",
      href: "/sb-mail-admin/withdrawals",
      icon: Wallet,
      active: relativePath.startsWith("/withdrawals"),
    },
    {
      title: "Disputes",
      href: "/sb-mail-admin/disputes",
      icon: AlertTriangle,
      active: relativePath.startsWith("/disputes"),
      badge: "3", // You can make this dynamic
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-layout">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">Gmail Market</p>
              </div>
            </div>

            <div className="space-y-2">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      item.active && "bg-blue-600 text-white hover:bg-blue-700",
                    )}
                    data-testid={`nav-link-${item.title.toLowerCase()}`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                    {item.badge && (
                      <Badge
                        variant="destructive"
                        className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t space-y-2">
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="link-back-to-site"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Site
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={logout}
                disabled={isLoggingOut}
                data-testid="button-admin-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your Gmail marketplace
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">MongoDB Connected</Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 min-h-[calc(100vh-73px)]">{children}</div>
        </div>
      </div>
    </div>
  );
}
