import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import CategoryListings from "@/pages/category-listings";
import SellerDashboard from "@/pages/seller-dashboard";
import BuyerDashboard from "@/pages/buyer-dashboard";
import Verification from "@/pages/verification";
import MyPurchases from "@/pages/my-purchases";
import Profile from "@/pages/profile";
import Terms from "./pages/terms";
import AdminLayout from "@/components/AdminLayout";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminCategories from "@/pages/admin/categories";
import AdminTransactions from "@/pages/admin/transactions";
import AdminDeposits from "@/pages/admin/deposits";
import AdminWithdrawals from "@/pages/admin/withdrawals";
import AdminDisputes from "@/pages/admin/disputes";
import Signup from "@/pages/signup";
import Login from "@/pages/login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useAdminAuth();

  return (
    <Switch>
      {/* Admin Login Route */}
      <Route path="/admin-login" component={AdminLogin} />

      {/* Admin Routes - Non-nested for simplicity */}
      <Route path="/sb-mail-admin">
        {isAdminLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-lg">Loading...</div>
          </div>
        ) : isAdmin ? (
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        ) : (
          <AdminLogin />
        )}
      </Route>

      <Route path="/sb-mail-admin/users">
        {isAdminLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-lg">Loading...</div>
          </div>
        ) : isAdmin ? (
          <AdminLayout>
            <AdminUsers />
          </AdminLayout>
        ) : (
          <AdminLogin />
        )}
      </Route>

      <Route path="/sb-mail-admin/categories">
        {isAdminLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-lg">Loading...</div>
          </div>
        ) : isAdmin ? (
          <AdminLayout>
            <AdminCategories />
          </AdminLayout>
        ) : (
          <AdminLogin />
        )}
      </Route>

      <Route path="/sb-mail-admin/transactions">
        {isAdminLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-lg">Loading...</div>
          </div>
        ) : isAdmin ? (
          <AdminLayout>
            <AdminTransactions />
          </AdminLayout>
        ) : (
          <AdminLogin />
        )}
      </Route>

      <Route path="/sb-mail-admin/deposits">
        {isAdminLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-lg">Loading...</div>
          </div>
        ) : isAdmin ? (
          <AdminLayout>
            <AdminDeposits />
          </AdminLayout>
        ) : (
          <AdminLogin />
        )}
      </Route>

      <Route path="/sb-mail-admin/withdrawals">
        {isAdminLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-lg">Loading...</div>
          </div>
        ) : isAdmin ? (
          <AdminLayout>
            <AdminWithdrawals />
          </AdminLayout>
        ) : (
          <AdminLogin />
        )}
      </Route>

      <Route path="/sb-mail-admin/disputes">
        {isAdminLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-lg">Loading...</div>
          </div>
        ) : isAdmin ? (
          <AdminLayout>
            <AdminDisputes />
          </AdminLayout>
        ) : (
          <AdminLogin />
        )}
      </Route>

      {/* Auth Routes */}
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />

      {/* Public/User Routes */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/category/:slug" component={CategoryListings} />
          <Route path="/sell" component={SellerDashboard} />
          <Route path="/dashboard" component={BuyerDashboard} />
          <Route path="/my-purchases" component={MyPurchases} />
          <Route path="/profile" component={Profile} />
          <Route path="/verification/:transactionId" component={Verification} />
          <Route path="/terms" component={Terms} />

        {/* Admin Routes */}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;