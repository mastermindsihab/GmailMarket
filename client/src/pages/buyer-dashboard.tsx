import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, DollarSign, Clock, CheckCircle, Eye, TriangleAlert, Sparkles, User, GraduationCap, LayersIcon, Timer, ShieldX, Plus, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const categoryIcons = {
  fresh: Sparkles,
  aged: Clock,
  used: User,
  edu: GraduationCap,
  bulk: LayersIcon,
  temporary: Timer,
  pva: CheckCircle,
  "non-pva": ShieldX,
};

function getStatusColor(status: string) {
  switch (status) {
    case 'verified':
      return 'bg-green-100 text-green-900 border border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-900 border border-yellow-200';
    case 'disputed':
      return 'bg-red-100 text-red-900 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-900 border border-gray-200';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'verified':
      return CheckCircle;
    case 'pending':
      return Clock;
    case 'disputed':
      return TriangleAlert;
    default:
      return Eye;
  }
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [userPhone, setUserPhone] = useState("");

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/buyer"],
  });

  const addBalanceMutation = useMutation({
    mutationFn: async (depositData: { amount: number; paymentMethod?: string; transactionId?: string; userPhone?: string }) => {
      const response = await apiRequest("/api/deposit-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(depositData),
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deposit Request Submitted",
        description: `Your deposit request for $${amount} has been submitted and is awaiting admin approval`,
      });
      // Reset form fields
      setAmount("");
      setPaymentMethod("");
      setTransactionId("");
      setUserPhone("");
      setShowAddBalance(false);
      // Refresh deposit requests
      queryClient.invalidateQueries({ queryKey: ["/api/deposit-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Payment numbers for bKash and Nagad
  const paymentNumbers = {
    bkash: "01712345678",
    nagad: "01987654321"
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    });
  };

  const handleAddBalance = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0 || amountNum > 1000) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount between $1 and $1000",
        variant: "destructive",
      });
      return;
    }

    // Validation for mobile money payments
    if (paymentMethod && (!transactionId || !userPhone)) {
      toast({
        title: "Missing Information",
        description: "Please provide transaction ID and phone number for mobile money payments",
        variant: "destructive",
      });
      return;
    }

    const depositData = {
      amount: amountNum,
      ...(paymentMethod && { paymentMethod }),
      ...(transactionId && { transactionId }),
      ...(userPhone && { userPhone }),
    };

    addBalanceMutation.mutate(depositData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const transactions = dashboardData?.transactions || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8" data-testid="text-dashboard-title">Buyer Dashboard</h2>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card data-testid="card-total-purchases">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Purchases</p>
                  <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-purchases">{stats.totalPurchases || 0}</p>
                </div>
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-amount-spent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Amount Spent</p>
                  <p className="text-xl sm:text-2xl font-bold" data-testid="text-amount-spent">${stats.totalSpent || '0'}</p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-verification">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending Verification</p>
                  <p className="text-xl sm:text-2xl font-bold" data-testid="text-pending-verification">{stats.pendingVerification || 0}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-success-rate">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-xl sm:text-2xl font-bold" data-testid="text-success-rate">{stats.successRate || 0}%</p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Purchases */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Purchases</CardTitle>
            <CardDescription>Your transaction history and verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 sm:py-3 min-w-[80px]">Date</th>
                    <th className="text-left py-2 sm:py-3 min-w-[100px]">Category</th>
                    <th className="text-left py-2 sm:py-3 min-w-[80px] hidden sm:table-cell">Seller</th>
                    <th className="text-left py-2 sm:py-3 min-w-[60px]">Amount</th>
                    <th className="text-left py-2 sm:py-3 min-w-[100px]">Status</th>
                    <th className="text-right py-2 sm:py-3 min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(transactions || []).map((transaction: any, index: number) => {
                    const IconComponent = categoryIcons[transaction.category.slug as keyof typeof categoryIcons] || User;
                    const StatusIcon = getStatusIcon(transaction.status);

                    return (
                      <tr key={transaction.id} className="border-b border-border" data-testid={`row-transaction-${index}`}>
                        <td className="py-2 sm:py-3" data-testid={`text-date-${index}`}>
                          <div className="text-xs sm:text-sm">
                            {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3">
                          <div className="flex items-center">
                            <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-1 sm:mr-2" />
                            <span className="text-xs sm:text-sm" data-testid={`text-category-${index}`}>{transaction.category.name}</span>
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 hidden sm:table-cell" data-testid={`text-seller-${index}`}>
                          {transaction.seller.email?.split('@')[0] || 'Anonymous'}
                        </td>
                        <td className="py-2 sm:py-3 font-medium text-xs sm:text-sm" data-testid={`text-amount-${index}`}>${transaction.amount}</td>
                        <td className="py-2 sm:py-3">
                          <Badge className={`${getStatusColor(transaction.status)} text-xs`} data-testid={`badge-status-${index}`}>
                            <StatusIcon className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                            <span className="hidden sm:inline">
                              {transaction.status === 'pending' ? 'Pending Verification' : 
                               transaction.status === 'verified' ? 'Completed' :
                               transaction.status === 'disputed' ? 'Disputed' : transaction.status}
                            </span>
                            <span className="sm:hidden">
                              {transaction.status === 'pending' ? 'Pending' : 
                               transaction.status === 'verified' ? 'Done' :
                               transaction.status === 'disputed' ? 'Dispute' : transaction.status}
                            </span>
                          </Badge>
                        </td>
                        <td className="py-2 sm:py-3 text-right">
                          {transaction.status === 'pending' && (
                            <Button 
                              size="sm"
                              onClick={() => setLocation(`/verification/${transaction.id}`)}
                              data-testid={`button-verify-${index}`}
                            >
                              Verify
                            </Button>
                          )}
                          {transaction.status === 'verified' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`button-view-${index}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {transaction.status === 'disputed' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`button-dispute-${index}`}
                            >
                              <TriangleAlert className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {(transactions || []).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No purchases yet. Start by browsing our categories!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card data-testid="card-quick-purchase">
            <CardHeader>
              <CardTitle>Quick Purchase</CardTitle>
              <CardDescription>Jump to any category to make a quick purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setLocation('/')}
                data-testid="button-browse-categories"
              >
                Browse Categories
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="card-account-balance">
            <CardHeader>
              <CardTitle>Account Balance</CardTitle>
              <CardDescription>
                Add funds to your account to purchase Gmail accounts
              </CardDescription>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-1">
                  Deposit Rules:
                </h4>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p>• Minimum deposit: $5 | Maximum: $1000 per request</p>
                  <p>• Processing time: 1-24 hours after admin approval</p>
                  <p>• For mobile money: Provide valid transaction ID & phone</p>
                  <p>• Match transaction phone with your registered number</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary mb-4" data-testid="text-balance">
                ${user?.balance || '0.00'}
              </div>
              <Dialog open={showAddBalance} onOpenChange={setShowAddBalance}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    data-testid="button-add-funds"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Deposit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Request Deposit</DialogTitle>
                    <DialogDescription>
                      Send money via bKash/Nagad and submit your transaction details
                    </DialogDescription>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm mb-1">
                        Withdrawal Rules:
                      </h4>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                        <p>• Minimum withdrawal: $5 | Maximum: Your balance</p>
                        <p>• Processing time: 1-72 hours after approval</p>
                        <p>• Provide accurate account details for payment</p>
                        <p>• Withdrawals to verified accounts only</p>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Payment Method Selection */}
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bkash">bKash</SelectItem>
                          <SelectItem value="nagad">Nagad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Numbers Display */}
                    {paymentMethod && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          Send money to this {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} number:
                        </div>
                        <div className="flex items-center justify-between bg-background p-3 rounded border">
                          <span className="font-mono text-lg" data-testid="text-payment-number">
                            {paymentNumbers[paymentMethod as keyof typeof paymentNumbers]}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(
                              paymentNumbers[paymentMethod as keyof typeof paymentNumbers],
                              `${paymentMethod.toUpperCase()} number`
                            )}
                            data-testid="button-copy-number"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Use "Send Money" option and send the exact amount below
                        </div>
                      </div>
                    )}

                    {/* Amount Input */}
                    <div>
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter deposit amount (max $1000)"
                        min="1"
                        max="1000"
                        step="0.01"
                        data-testid="input-add-amount"
                      />
                    </div>

                    {/* Transaction ID Input */}
                    {paymentMethod && (
                      <div>
                        <Label htmlFor="transactionId">Transaction ID</Label>
                        <Input
                          id="transactionId"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Enter transaction ID from your mobile"
                          data-testid="input-transaction-id"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Check your mobile SMS for the transaction ID
                        </div>
                      </div>
                    )}

                    {/* User Phone Input */}
                    {paymentMethod && (
                      <div>
                        <Label htmlFor="userPhone">Your Phone Number</Label>
                        <Input
                          id="userPhone"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="Enter your mobile number"
                          data-testid="input-user-phone"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Number you used to send money
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <strong>Instructions:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1 text-xs">
                        <li>Select payment method above</li>
                        <li>Copy the {paymentMethod || 'payment'} number</li>
                        <li>Send money from your mobile</li>
                        <li>Enter transaction details here</li>
                        <li>Submit for admin approval</li>
                      </ol>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowAddBalance(false);
                          setAmount("");
                          setPaymentMethod("");
                          setTransactionId("");
                          setUserPhone("");
                        }}
                        data-testid="button-cancel-add"
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleAddBalance}
                        disabled={addBalanceMutation.isPending}
                        data-testid="button-confirm-add"
                      >
                        {addBalanceMutation.isPending ? "Submitting..." : "Submit Request"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}