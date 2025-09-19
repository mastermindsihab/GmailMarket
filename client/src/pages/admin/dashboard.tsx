import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Package, ShoppingCart, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AdminStats {
  totalUsers: number;
  totalCategories: number;
  totalTransactions: number;
  totalDisputes: number;
  totalRevenue: string;
  pendingVerifications: number;
}

interface RecentActivity {
  type: 'user' | 'transaction' | 'dispute' | 'category';
  message: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: recentActivity } = useQuery<RecentActivity[]>({
    queryKey: ['/api/admin/recent-activity'],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your Gmail marketplace</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      description: "Registered users",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Categories",
      value: stats?.totalCategories || 0,
      description: "Account categories",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Transactions",
      value: stats?.totalTransactions || 0,
      description: "Total transactions",
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Disputes",
      value: stats?.totalDisputes || 0,
      description: "Open disputes",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Revenue",
      value: `$${stats?.totalRevenue || '0'}`,
      description: "Total platform revenue",
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Pending",
      value: stats?.pendingVerifications || 0,
      description: "Pending verifications",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="p-6" data-testid="admin-dashboard">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your Gmail marketplace</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your platform efficiently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/users">
              <Button className="w-full justify-start" variant="outline" data-testid="button-users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button className="w-full justify-start" variant="outline" data-testid="button-categories">
                <Package className="mr-2 h-4 w-4" />
                Manage Categories
              </Button>
            </Link>
            <Link href="/admin/transactions">
              <Button className="w-full justify-start" variant="outline" data-testid="button-transactions">
                <ShoppingCart className="mr-2 h-4 w-4" />
                View Transactions
              </Button>
            </Link>
            <Link href="/admin/disputes">
              <Button className="w-full justify-start" variant="outline" data-testid="button-disputes">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Resolve Disputes
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  const getVariant = (type: string) => {
                    switch (type) {
                      case 'user': return 'secondary';
                      case 'dispute': return 'destructive';
                      case 'transaction': return 'default';
                      case 'category': return 'outline';
                      default: return 'secondary';
                    }
                  };
                  
                  const getLabel = (type: string) => {
                    switch (type) {
                      case 'user': return 'New User';
                      case 'dispute': return 'Dispute';
                      case 'transaction': return 'Transaction';
                      case 'category': return 'Category';
                      default: return type;
                    }
                  };
                  
                  const timeAgo = new Date(activity.timestamp).toLocaleString();
                  
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <Badge variant={getVariant(activity.type) as any}>{getLabel(activity.type)}</Badge>
                      <span className="text-sm">{activity.message} - {timeAgo}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <span className="text-sm text-muted-foreground">No recent activity</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}