import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PurchaseModal } from "@/components/PurchaseModal";
import { SuccessModal } from "@/components/SuccessModal";
import { ReportModal } from "@/components/ReportModal";
import { Star, ShoppingCart, Copy, Eye, EyeOff, Check, TriangleAlert, Plus, Minus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CategoryListings() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTransactionId, setReportTransactionId] = useState<string | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const { toast } = useToast();

  const togglePasswordVisibility = (transactionId: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(transactionId)) {
      newVisible.delete(transactionId);
    } else {
      newVisible.add(transactionId);
    }
    setVisiblePasswords(newVisible);
  };

  const { data: category, isLoading: categoryLoading } = useQuery<any>({
    queryKey: [`/api/categories/${slug}`],
  });

  const { data: sellers, isLoading: sellersLoading } = useQuery<any[]>({
    queryKey: [`/api/categories/${category?.id}/accounts`],
    enabled: !!category?.id,
  });

  const { data: myPurchases, isLoading: purchasesLoading } = useQuery<any[]>({
    queryKey: [`/api/categories/${category?.id}/my-purchases`],
    enabled: !!category?.id,
  });

  const handlePurchase = (seller: any) => {
    // Direct purchase with quantity
    purchaseMutation.mutate({ seller, quantity: purchaseQuantity });
  };

  const purchaseMutation = useMutation({
    mutationFn: async ({ seller, quantity }: { seller: any; quantity: number }) => {
      const response = await apiRequest("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: category.slug,
          sellerId: seller.seller.id,
          quantity: quantity,
        }),
      });
      return response.json();
    },
    onSuccess: (result) => {
      // Refresh the accounts list and purchases list
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${category?.slug}/accounts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${category?.id}/my-purchases`] });

      toast({
        title: "Purchase Successful!",
        description: `Successfully purchased ${result.quantity || 1} Gmail account${(result.quantity || 1) > 1 ? 's' : ''}`,
      });

      // Reset quantity to 1
      setPurchaseQuantity(1);
    },
    onError: (error: Error) => {
      console.error("Purchase failed:", error);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiRequest(`/api/transactions/${transactionId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Complete",
        description: "Purchase confirmed! The seller has been paid.",
      });
      // Refresh the purchases list
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${category?.id}/my-purchases`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerifyPurchase = (transactionId: string) => {
    verifyMutation.mutate(transactionId);
  };

  const handleReportPurchase = (transactionId: string) => {
    setReportTransactionId(transactionId);
    setShowReportModal(true);
  };

  // Remove unused function
  // const handlePurchaseSuccess = (result: any) => {
  //   setPurchaseResult(result);
  //   setShowPurchaseModal(false);
  //   setShowSuccessModal(true);
  // };

  if (categoryLoading || sellersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <Button onClick={() => setLocation('/')} data-testid="button-back-home">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => setLocation('/')}
                className="text-muted-foreground hover:text-primary"
                data-testid="link-breadcrumb-home"
              >
                Home
              </button>
            </li>
            <li><span className="text-muted-foreground text-xs">›</span></li>
            <li><span className="text-foreground font-medium" data-testid="text-breadcrumb-category">{category?.name || 'Category'}</span></li>
          </ol>
        </nav>

        {/* Category Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2" data-testid="text-category-name">{category?.name || 'Category'}</CardTitle>
                <CardDescription data-testid="text-category-description">{category?.description || 'Description'}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary" data-testid="text-category-price">${category?.sellPrice || '0'}</div>
                <div className="text-sm text-muted-foreground">Fixed Price</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Available Accounts */}
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Card className="p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Ready to Purchase</h3>
                <p className="text-muted-foreground mb-4">
                  {(sellers || []).reduce((total: number, seller: any) => total + seller.availableCount, 0)} accounts available
                </p>

                {/* Quantity Selector */}
                <div className="mb-4">
                  <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                      disabled={purchaseQuantity <= 1}
                      data-testid="button-decrease-quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      value={purchaseQuantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const maxAvailable = (sellers || []).reduce((total: number, seller: any) => total + seller.availableCount, 0);
                        setPurchaseQuantity(Math.min(Math.max(1, value), maxAvailable));
                      }}
                      min="1"
                      max={(sellers || []).reduce((total: number, seller: any) => total + seller.availableCount, 0)}
                      className="w-20 text-center"
                      data-testid="input-purchase-quantity"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const maxAvailable = (sellers || []).reduce((total: number, seller: any) => total + seller.availableCount, 0);
                        setPurchaseQuantity(Math.min(purchaseQuantity + 1, maxAvailable));
                      }}
                      disabled={purchaseQuantity >= (sellers || []).reduce((total: number, seller: any) => total + seller.availableCount, 0)}
                      data-testid="button-increase-quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-3xl font-bold text-primary mb-2">
                  ${((category?.sellPrice || 0) * purchaseQuantity).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  ${category?.sellPrice || '0'} × {purchaseQuantity} account{purchaseQuantity > 1 ? 's' : ''} • Instant delivery
                </p>
              </div>

              {(sellers || []).length > 0 && (
                <Button
                  className="w-full text-lg py-6"
                  onClick={() => handlePurchase(sellers[0])}
                  disabled={purchaseMutation.isPending}
                  data-testid="button-buy-now"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {purchaseMutation.isPending ? "Processing..." : `Buy ${purchaseQuantity > 1 ? `${purchaseQuantity} Accounts` : 'Now'}`}
                </Button>
              )}
            </Card>
          </div>
        </div>

        {(sellers || []).length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No sellers available</h3>
            <p className="text-muted-foreground">Check back later for new listings in this category.</p>
          </div>
        )}

        {/* My Purchases from this Category - Grouped by Time */}
        {(myPurchases || []).length > 0 && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>My Purchases from {category?.name}</CardTitle>
                <CardDescription>
                  {(myPurchases || []).length} account(s) purchased from this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Group purchases by date
                  const groupedPurchases = (myPurchases || []).reduce((groups: any, purchase: any) => {
                    const purchaseDate = new Date(purchase.createdAt);
                    const dateKey = purchaseDate.toLocaleDateString();
                    const timeKey = purchaseDate.toLocaleString();

                    if (!groups[dateKey]) {
                      groups[dateKey] = [];
                    }
                    groups[dateKey].push({ ...purchase, timeKey });
                    return groups;
                  }, {});

                  return Object.entries(groupedPurchases).map(([dateKey, purchases]: [string, any]) => (
                    <div key={dateKey} className="mb-8 last:mb-0">
                      {/* Date Header */}
                      <div className="flex items-center mb-4">
                        <div className="flex-1 h-px bg-border"></div>
                        <div className="px-4 py-2 bg-muted rounded-lg">
                          <span className="text-sm font-semibold text-foreground" data-testid={`text-purchase-date-group-${dateKey}`}>
                            Purchased on {dateKey}
                          </span>
                        </div>
                        <div className="flex-1 h-px bg-border"></div>
                      </div>

                      {/* Group purchases by exact time within the date */}
                      {(() => {
                        const timeGroups = purchases.reduce((timeGrouped: any, purchase: any) => {
                          const exactTime = new Date(purchase.createdAt).toLocaleTimeString();
                          if (!timeGrouped[exactTime]) {
                            timeGrouped[exactTime] = [];
                          }
                          timeGrouped[exactTime].push(purchase);
                          return timeGrouped;
                        }, {});

                        return Object.entries(timeGroups).map(([timeKey, timePurchases]: [string, any]) => (
                          <div key={timeKey} className="mb-6 last:mb-0">
                            {/* Time Header */}
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-muted-foreground" data-testid={`text-purchase-time-${timeKey.replace(/[^\w]/g, '-')}`}>
                                {timeKey} - {timePurchases.length} account{timePurchases.length > 1 ? 's' : ''} purchased
                              </h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const allData = timePurchases.map((p: any) => {
                                    const email = p.account?.email || 'N/A';
                                    const password = p.account?.password || 'N/A';
                                    const recovery = p.account?.recoveryEmail || 'N/A';

                                    return `${email}\t${password}\t${recovery}`;
                                  }).join('\n');

                                  navigator.clipboard.writeText(allData);
                                  toast({ title: "Copied", description: `${timePurchases.length} Gmail accounts copied for Excel/Sheets` });
                                }}
                                data-testid={`button-copy-all-${timeKey.replace(/[^\w]/g, '-')}`}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy All
                              </Button>
                            </div>

                            {/* Gmail Accounts Table */}
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="w-12 text-xs font-semibold">#</TableHead>
                                    <TableHead className="min-w-[200px] text-xs font-semibold">Email</TableHead>
                                    <TableHead className="hidden sm:table-cell min-w-[120px] text-xs font-semibold">Password</TableHead>
                                    <TableHead className="hidden md:table-cell min-w-[150px] text-xs font-semibold">Recovery Email</TableHead>
                                    <TableHead className="min-w-[100px] text-xs font-semibold">Date</TableHead>
                                    <TableHead className="min-w-[80px] text-xs font-semibold">Status</TableHead>
                                    <TableHead className="text-center min-w-[120px] text-xs font-semibold">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {timePurchases.map((purchase: any, index: number) => {
                                    const globalIndex = `${dateKey}-${timeKey}-${index}`.replace(/[^\w-]/g, '-');
                                    return (
                                      <TableRow
                                        key={purchase.id}
                                        className="hover:bg-muted/30 border-b"
                                        data-testid={`row-purchase-${globalIndex}`}
                                      >
                                        {/* Serial Number */}
                                        <TableCell className="text-center font-medium" data-testid={`text-purchased-serial-${globalIndex}`}>
                                          {index + 1}
                                        </TableCell>

                                        {/* Gmail Address */}
                                        <TableCell className="font-mono text-sm">
                                          <div className="flex items-center space-x-2">
                                            <span
                                              className="flex-1 select-all cursor-text"
                                              data-testid={`text-purchased-email-${globalIndex}`}
                                            >
                                              {purchase.account?.email || 'N/A'}
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0"
                                              onClick={() => {
                                                navigator.clipboard.writeText(purchase.account?.email || '');
                                                toast({ title: "Copied", description: "Email copied to clipboard" });
                                              }}
                                              data-testid={`button-copy-purchased-email-${globalIndex}`}
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </TableCell>

                                        {/* Password */}
                                        <TableCell className="font-mono text-sm">
                                          <div className="flex items-center space-x-2">
                                            <span
                                              className="flex-1 select-all cursor-text"
                                              data-testid={`text-purchased-password-${globalIndex}`}
                                            >
                                              {visiblePasswords.has(purchase.id)
                                                ? purchase.account?.password || 'N/A'
                                                : '••••••••••••'
                                              }
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0"
                                              onClick={() => togglePasswordVisibility(purchase.id)}
                                              data-testid={`button-toggle-purchased-password-${globalIndex}`}
                                            >
                                              {visiblePasswords.has(purchase.id) ?
                                                <EyeOff className="w-3 h-3" /> :
                                                <Eye className="w-3 h-3" />
                                              }
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0"
                                              onClick={() => {
                                                navigator.clipboard.writeText(purchase.account?.password || '');
                                                toast({ title: "Copied", description: "Password copied to clipboard" });
                                              }}
                                              data-testid={`button-copy-purchased-password-${globalIndex}`}
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </TableCell>

                                        {/* Recovery Email */}
                                        <TableCell className="font-mono text-sm">
                                          {purchase.account?.recoveryEmail ? (
                                            <div className="flex items-center space-x-2">
                                              <span
                                                className="flex-1 select-all cursor-text"
                                                data-testid={`text-purchased-recovery-${globalIndex}`}
                                              >
                                                {purchase.account.recoveryEmail}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(purchase.account.recoveryEmail);
                                                  toast({ title: "Copied", description: "Recovery email copied to clipboard" });
                                                }}
                                                data-testid={`button-copy-purchased-recovery-${globalIndex}`}
                                              >
                                                <Copy className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </TableCell>

                                        {/* Amount */}
                                        <TableCell className="text-center font-semibold" data-testid={`text-purchased-amount-${globalIndex}`}>
                                          ${purchase.amount}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="text-center">
                                          <Badge
                                            className={
                                              purchase.status === 'verified'
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                : purchase.status === 'disputed'
                                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                : purchase.status === 'refunded'
                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                            }
                                            data-testid={`badge-purchased-status-${globalIndex}`}
                                          >
                                            {purchase.status === 'verified' ? 'Verified' :
                                             purchase.status === 'disputed' ? 'Disputed' :
                                             purchase.status === 'refunded' ? 'Refunded' :
                                             'Pending'}
                                          </Badge>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-center">
                                          {purchase.status === 'pending' ? (
                                            <div className="flex justify-center space-x-1">
                                              <Button
                                                size="sm"
                                                className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                                onClick={() => handleVerifyPurchase(purchase.id)}
                                                disabled={verifyMutation.isPending}
                                                data-testid={`button-verify-purchased-${globalIndex}`}
                                              >
                                                <Check className="w-3 h-3 mr-1" />
                                                {verifyMutation.isPending ? "..." : "Verify"}
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                className="h-7 px-2"
                                                onClick={() => {
                                                  setReportTransactionId(purchase.id);
                                                  setShowReportModal(true);
                                                }}
                                                data-testid={`button-report-purchased-${globalIndex}`}
                                              >
                                                <TriangleAlert className="w-3 h-3 mr-1" />
                                                Report
                                              </Button>
                                            </div>
                                          ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>



      {showReportModal && reportTransactionId && (
        <ReportModal
          transactionId={reportTransactionId}
          onClose={() => {
            setShowReportModal(false);
            setReportTransactionId(null);
          }}
          onSuccess={() => {
            setShowReportModal(false);
            setReportTransactionId(null);
            // Refresh the purchases list
            queryClient.invalidateQueries({ queryKey: [`/api/categories/${category?.id}/my-purchases`] });
          }}
        />
      )}
    </div>
  );
}