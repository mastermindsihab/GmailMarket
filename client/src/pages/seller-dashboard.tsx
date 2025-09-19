import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, List, Clock, CheckCircle, Plus, Sparkles, User, GraduationCap, LayersIcon, Timer, ShieldX, Briefcase, Upload, FileText, AlertTriangle, Check, X, Wallet, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function SellerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [accounts, setAccounts] = useState([{ email: "", password: "", recoveryEmail: "" }]);

  // Bulk upload states
  const [bulkData, setBulkData] = useState("");
  const [parsedAccounts, setParsedAccounts] = useState<any[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");

  // Withdrawal states
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/dashboard/seller"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: sellerDisputes, isLoading: disputesLoading } = useQuery({
    queryKey: ["/api/seller/disputes"],
  });

  const { data: withdrawalRequests, isLoading: withdrawalLoading } = useQuery({
    queryKey: ["/api/withdrawal-requests"],
  });

  const disputeResponseMutation = useMutation({
    mutationFn: async ({ disputeId, action }: { disputeId: string; action: 'accept' | 'reject' }) => {
      const response = await apiRequest(`/api/disputes/${disputeId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dispute response submitted successfully!",
      });
      // Refresh disputes data
      queryClient.invalidateQueries({ queryKey: ["/api/seller/disputes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (withdrawalData: any) => {
      const response = await apiRequest("/api/withdrawal-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withdrawalData),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully!",
      });
      // Reset form
      setWithdrawalAmount("");
      setPaymentMethod("");
      setAccountNumber("");
      setAccountName("");
      setBankName("");
      // Refresh withdrawal data
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  const addAccountsMutation = useMutation({
    mutationFn: async (accountsData: any[]) => {
      const response = await apiRequest("/api/gmail-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountsData),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Gmail accounts added successfully!",
      });
      // Reset forms
      resetIndividualForm();
      resetBulkForm();
      // Refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/seller"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    const newAccounts = Array(newQuantity).fill(null).map((_, index) => 
      accounts[index] || { email: "", password: "", recoveryEmail: "" }
    );
    setAccounts(newAccounts);
  };

  const handleAccountChange = (index: number, field: string, value: string) => {
    const newAccounts = [...accounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setAccounts(newAccounts);
  };

  const parseBulkData = (data: string) => {
    const lines = data.trim().split('\n').filter(line => line.trim());
    const parsed = [];

    for (const line of lines) {
      // Try tab-separated first, then comma-separated
      let parts = line.split('\t');
      if (parts.length < 2) {
        parts = line.split(',');
      }

      if (parts.length >= 2) {
        parsed.push({
          email: parts[0]?.trim() || '',
          password: parts[1]?.trim() || '',
          recoveryEmail: parts[2]?.trim() || '',
        });
      }
    }

    return parsed.filter(acc => acc.email && acc.password);
  };

  const handleBulkDataChange = (data: string) => {
    setBulkData(data);
    if (data.trim()) {
      const parsed = parseBulkData(data);
      setParsedAccounts(parsed);
    } else {
      setParsedAccounts([]);
    }
  };

  const handleSubmit = () => {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    const validAccounts = accounts.filter(acc => acc.email && acc.password);
    if (validAccounts.length === 0) {
      toast({
        title: "Error",
        description: "Please provide at least one complete account",
        variant: "destructive",
      });
      return;
    }

    const accountsWithCategory = validAccounts.map(account => ({
      ...account,
      categoryId: selectedCategory,
    }));

    addAccountsMutation.mutate(accountsWithCategory);
  };

  const handleBulkSubmit = () => {
    if (!bulkCategory) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (parsedAccounts.length === 0) {
      toast({
        title: "Error",
        description: "Please paste valid account data",
        variant: "destructive",
      });
      return;
    }

    const accountsWithCategory = parsedAccounts.map(account => ({
      ...account,
      categoryId: bulkCategory,
    }));

    addAccountsMutation.mutate(accountsWithCategory);
  };

  const resetBulkForm = () => {
    setBulkData("");
    setParsedAccounts([]);
    setBulkCategory("");
  };

  const resetIndividualForm = () => {
    setSelectedCategory("");
    setQuantity(1);
    setAccounts([{ email: "", password: "", recoveryEmail: "" }]);
  };

  const handleWithdrawalSubmit = () => {
    if (!withdrawalAmount || !paymentMethod || !accountNumber || !accountName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'bank' && !bankName) {
      toast({
        title: "Error",
        description: "Bank name is required for bank transfers",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount < 5) {
      toast({
        title: "Error",
        description: "Minimum withdrawal amount is $5",
        variant: "destructive",
      });
      return;
    }

    if (user && amount > parseFloat(user.balance)) {
      toast({
        title: "Error",
        description: "Insufficient balance for withdrawal",
        variant: "destructive",
      });
      return;
    }

    withdrawalMutation.mutate({
      amount: withdrawalAmount,
      paymentMethod,
      accountNumber,
      accountName,
      ...(bankName && { bankName })
    });
  };

  if (dashboardLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const stats = (dashboardData as any)?.stats || { totalSales: '0', activeListings: 0, totalRevenue: '0', pendingVerifications: 0 };
  const inventory = (dashboardData as any)?.inventory || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8" data-testid="text-dashboard-title">Seller Dashboard</h2>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card data-testid="card-total-sales">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold" data-testid="text-total-sales">${stats.totalSales || '0'}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-active-listings">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold" data-testid="text-active-listings">{stats.activeListings || 0}</p>
                </div>
                <List className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-orders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold" data-testid="text-pending-orders">{stats.pendingOrders || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-success-rate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold" data-testid="text-success-rate">{stats.successRate || 0}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Accounts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Gmail Accounts</CardTitle>
            <CardDescription>
          Add new Gmail accounts to sell on the platform
        </CardDescription>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3">
          <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm mb-1">
            Selling Guidelines:
          </h4>
          <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
            <p>• Only add working, accessible accounts</p>
            <p>• Provide accurate recovery email information</p>
            <p>• Respond to disputes within 3 hours</p>
            <p>• Payment released after buyer verification</p>
            <p>• Quality accounts increase success rate</p>
          </div>
        </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual" data-testid="tab-individual">
                  <Plus className="w-4 h-4 mr-2" />
                  Individual Add
                </TabsTrigger>
                <TabsTrigger value="bulk" data-testid="tab-bulk">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) ? categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} - ${category.buyPrice} (you earn)
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity to Add</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max="50"
                  data-testid="input-quantity"
                />
              </div>
            </div>

            {/* Account Input Forms */}
            <div className="space-y-4 mb-6">
              <h4 className="font-medium">Account Credentials</h4>
              {accounts.map((account, index) => (
                <div key={index} className="border border-border rounded p-4 bg-muted">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`email-${index}`}>Gmail Address</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={account.email}
                        onChange={(e) => handleAccountChange(index, 'email', e.target.value)}
                        placeholder="example@gmail.com"
                        data-testid={`input-email-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`password-${index}`}>Password</Label>
                      <Input
                        id={`password-${index}`}
                        type="password"
                        value={account.password}
                        onChange={(e) => handleAccountChange(index, 'password', e.target.value)}
                        placeholder="Account password"
                        data-testid={`input-password-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`recovery-${index}`}>Recovery Email</Label>
                      <Input
                        id={`recovery-${index}`}
                        type="email"
                        value={account.recoveryEmail}
                        onChange={(e) => handleAccountChange(index, 'recoveryEmail', e.target.value)}
                        placeholder="recovery@email.com"
                        data-testid={`input-recovery-${index}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    All accounts will be listed at the fixed category price
                  </div>
                  <Button 
                    onClick={handleSubmit}
                    disabled={addAccountsMutation.isPending}
                    data-testid="button-add-accounts"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {addAccountsMutation.isPending ? "Adding..." : "Add to Inventory"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="bulk" className="mt-6">
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Bulk Upload Instructions</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Copy data from Excel/Google Sheets and paste below</li>
                          <li>• Format: Email, Password, Recovery Email (each on a new line)</li>
                          <li>• Tab-separated or comma-separated values supported</li>
                          <li>• Recovery email is optional</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <Label htmlFor="bulk-category">Category</Label>
                    <Select value={bulkCategory} onValueChange={setBulkCategory}>
                      <SelectTrigger data-testid="select-bulk-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(categories) ? categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name} - ${category.buyPrice} (you earn)
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bulk Data Input */}
                  <div>
                    <Label htmlFor="bulk-data">Account Data</Label>
                    <Textarea
                      id="bulk-data"
                      value={bulkData}
                      onChange={(e) => handleBulkDataChange(e.target.value)}
                      placeholder="Paste your account data here...&#10;Example:&#10;user1@gmail.com     password123     recovery1@gmail.com&#10;user2@gmail.com password456     recovery2@gmail.com"
                      className="min-h-[200px] font-mono text-sm"
                      data-testid="textarea-bulk-data"
                    />
                  </div>

                  {/* Preview */}
                  {parsedAccounts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Preview ({parsedAccounts.length} accounts)</h4>
                      <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0">
                            <tr>
                              <th className="text-left p-3 border-b">#</th>
                              <th className="text-left p-3 border-b">Email</th>
                              <th className="text-left p-3 border-b">Password</th>
                              <th className="text-left p-3 border-b">Recovery</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedAccounts.map((account, index) => (
                              <tr key={index} className="border-b border-border" data-testid={`row-preview-${index}`}>
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3 font-mono">{account.email}</td>
                                <td className="p-3 font-mono">••••••••</td>
                                <td className="p-3 font-mono">{account.recoveryEmail || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {parsedAccounts.length > 0 && `${parsedAccounts.length} accounts ready to upload`}
                    </div>
                    <div className="space-x-2">
                      <Button 
                        variant="outline"
                        onClick={resetBulkForm}
                        disabled={addAccountsMutation.isPending}
                        data-testid="button-clear-bulk"
                      >
                        Clear
                      </Button>
                      <Button 
                        onClick={handleBulkSubmit}
                        disabled={addAccountsMutation.isPending || parsedAccounts.length === 0}
                        data-testid="button-bulk-upload"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {addAccountsMutation.isPending ? "Uploading..." : "Upload All"}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Current Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Current Inventory</CardTitle>
            <CardDescription>Your available accounts by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3">Category</th>
                    <th className="text-left py-3">Available</th>
                    <th className="text-left py-3">Buy Price</th>
                    <th className="text-left py-3">Sell Price</th>
                    <th className="text-left py-3">Total Sales</th>
                    <th className="text-left py-3">Revenue</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.filter((item: any) => item.count > 0).map((item: any, index: number) => {
                    const IconComponent = categoryIcons[item.category.slug as keyof typeof categoryIcons] || Briefcase;
                    return (
                      <tr key={item.category.id} className="border-b border-border" data-testid={`row-inventory-${index}`}>
                        <td className="py-3">
                          <div className="flex items-center">
                            <IconComponent className="h-5 w-5 text-primary mr-2" />
                            <span data-testid={`text-category-${index}`}>{item.category.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge 
                            className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium border",
                                item.status === 'active' 
                                  ? 'bg-green-100 text-green-900 border-green-200' 
                                  : 'bg-gray-100 text-gray-900 border-gray-200'
                              )}
                            data-testid={`badge-count-${index}`}
                          >
                            {item.count} accounts
                          </Badge>
                        </td>
                        <td className="py-3 font-medium text-orange-600" data-testid={`text-buy-price-${index}`}>
                          ${item.category.buyPrice}
                        </td>
                        <td className="py-3 font-medium text-blue-600" data-testid={`text-sell-price-${index}`}>
                          ${item.category.sellPrice}
                        </td>
                        <td className="py-3" data-testid={`text-sales-${index}`}>{item.totalSales} sales</td>
                        <td className="py-3 font-medium" data-testid={`text-revenue-${index}`}>${item.revenue}</td>
                        <td className="py-3">
                          <Badge 
                            className="bg-green-100 text-green-800"
                            data-testid={`badge-status-${index}`}
                          >
                            Active
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {inventory.filter((item: any) => item.count > 0).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No available inventory. Add your first Gmail accounts above!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reports & Disputes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Reports & Disputes
            </CardTitle>
            <CardDescription>Customer reports about your Gmail accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {disputesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div>
                {Array.isArray(sellerDisputes) && sellerDisputes.length > 0 ? (
                  <div className="space-y-4">
                    {sellerDisputes.map((dispute: any, index: number) => (
                      <div key={dispute.id} className="border border-border rounded-lg p-4 bg-muted/50" data-testid={`dispute-${index}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                            <h4 className="font-medium" data-testid={`dispute-title-${index}`}>
                              {dispute.issueType}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              className={
                                dispute.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                                dispute.status === 'resolved' ? "bg-green-100 text-green-800" :
                                "bg-red-100 text-red-800"
                              }
                              data-testid={`dispute-status-${index}`}
                            >
                              {dispute.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(dispute.createdAt).toLocaleDateString('bn-BD')}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Buyer Email</p>
                            <p className="font-medium" data-testid={`dispute-buyer-${index}`}>{dispute.buyer.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Transaction ID</p>
                            <p className="font-mono text-sm" data-testid={`dispute-transaction-${index}`}>{dispute.transactionId}</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-1">Customer Complaint</p>
                          <p className="text-sm bg-background p-3 rounded border" data-testid={`dispute-description-${index}`}>
                            {dispute.description}
                          </p>
                        </div>

                        {dispute.sellerResponse && (
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-1">Your Response</p>
                            <p className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                              {dispute.sellerResponse}
                            </p>
                          </div>
                        )}

                        {dispute.status === 'pending' && (
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="text-sm text-muted-foreground">
                              Response required within 3 hours of report submission
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => disputeResponseMutation.mutate({ disputeId: dispute.id, action: 'reject' })}
                                disabled={disputeResponseMutation.isPending}
                                data-testid={`button-reject-${index}`}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => disputeResponseMutation.mutate({ disputeId: dispute.id, action: 'accept' })}
                                disabled={disputeResponseMutation.isPending}
                                data-testid={`button-accept-${index}`}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept & Refund
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No reports yet! Great job maintaining account quality.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <CardTitle>Withdraw Earnings</CardTitle>
            </div>
            <CardDescription>Request to withdraw your earned money</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Current Balance */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Available Balance</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="text-available-balance">
                      ${user?.balance || '0.00'}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Withdrawal Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="withdrawal-amount">Amount to Withdraw</Label>
                    <Input
                      id="withdrawal-amount"
                      type="number"
                      placeholder="5.00"
                      min="5"
                      step="0.01"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      data-testid="input-withdrawal-amount"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Minimum withdrawal: $5</p>
                  </div>

                  <div>
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bkash">bKash</SelectItem>
                        <SelectItem value="nagad">Nagad</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="account-number">
                      {paymentMethod === 'bank' ? 'Account Number' : 'Phone Number'}
                    </Label>
                    <Input
                      id="account-number"
                      placeholder={paymentMethod === 'bank' ? 'Enter account number' : 'Enter phone number'}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      data-testid="input-account-number"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="account-name">Account Holder Name</Label>
                    <Input
                      id="account-name"
                      placeholder="Enter account holder name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      data-testid="input-account-name"
                    />
                  </div>

                  {paymentMethod === 'bank' && (
                    <div>
                      <Label htmlFor="bank-name">Bank Name</Label>
                      <Input
                        id="bank-name"
                        placeholder="Enter bank name"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        data-testid="input-bank-name"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleWithdrawalSubmit}
                    disabled={withdrawalMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-withdrawal"
                  >
                    {withdrawalMutation.isPending ? "Submitting..." : "Submit Withdrawal Request"}
                  </Button>
                </div>
              </div>

              {/* Withdrawal History */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
                {withdrawalLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.isArray(withdrawalRequests) && withdrawalRequests.length > 0 ? (
                      withdrawalRequests.map((withdrawal: any, index: number) => (
                        <div key={withdrawal.id} className="border rounded-lg p-4" data-testid={`withdrawal-${index}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <Badge 
                                variant={withdrawal.status === 'approved' ? 'default' : withdrawal.status === 'rejected' ? 'destructive' : 'secondary'}
                                data-testid={`badge-withdrawal-status-${index}`}
                              >
                                {withdrawal.status}
                              </Badge>
                              <span className="font-semibold" data-testid={`text-withdrawal-amount-${index}`}>
                                ${withdrawal.amount}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(withdrawal.createdAt).toLocaleDateString('bn-BD')}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Payment Method</p>
                              <p className="font-medium">{withdrawal.paymentMethod}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Account</p>
                              <p className="font-medium">{withdrawal.accountNumber}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Account Name</p>
                              <p className="font-medium">{withdrawal.accountName}</p>
                            </div>
                          </div>
                          {withdrawal.adminNote && (
                            <div className="mt-3 p-3 bg-muted rounded border">
                              <p className="text-sm text-muted-foreground mb-1">Admin Note</p>
                              <p className="text-sm">{withdrawal.adminNote}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No withdrawal requests yet. Submit your first withdrawal above!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}