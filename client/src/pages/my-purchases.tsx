import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Mail, Check, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportModal } from "@/components/ReportModal";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MyPurchases() {
  const { toast } = useToast();
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTransactionId, setReportTransactionId] = useState<string | null>(null);

  const { data: purchasesData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/buyer"],
  });

  const purchases = purchasesData?.transactions || [];

  const togglePasswordVisibility = (transactionId: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(transactionId)) {
      newVisible.delete(transactionId);
    } else {
      newVisible.add(transactionId);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/buyer"] });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2" data-testid="text-purchases-title">My Purchases</h2>
            <p className="text-muted-foreground">All your purchased Gmail accounts and credentials</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {purchases.length} accounts purchased
          </Badge>
        </div>

        {purchases.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse our categories and purchase Gmail accounts to see them here.
              </p>
              <Button onClick={() => window.location.href = "/"}>
                Browse Categories
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All My Purchases</CardTitle>
              <CardDescription>
                {purchases.length} account(s) purchased across all categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Group purchases by date
                const groupedPurchases = purchases.reduce((groups: any, purchase: any) => {
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
                                toast({
                                  title: "Copied",
                                  description: `${timePurchases.length} Gmail accounts copied for Excel/Sheets`
                                });
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
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                  <TableHead className="w-12 text-xs font-semibold">#</TableHead>
                                  <TableHead className="min-w-[180px] text-xs font-semibold">Email</TableHead>
                                  <TableHead className="hidden sm:table-cell min-w-[100px] text-xs font-semibold">Password</TableHead>
                                  <TableHead className="hidden md:table-cell min-w-[140px] text-xs font-semibold">Recovery Email</TableHead>
                                  <TableHead className="min-w-[100px] text-xs font-semibold">Category</TableHead>
                                  <TableHead className="min-w-[70px] text-xs font-semibold">Amount</TableHead>
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
                                      key={purchase.transactionId}
                                      className="hover:bg-muted/30 border-b"
                                      data-testid={`row-purchase-${globalIndex}`}
                                    >
                                      {/* Serial Number */}
                                      <TableCell className="text-center font-medium" data-testid={`text-purchased-serial-${globalIndex}`}>
                                        {index + 1}
                                      </TableCell>

                                      {/* Email */}
                                      <TableCell className="font-mono text-sm" data-testid={`text-purchased-email-${globalIndex}`}>
                                        <div className="flex items-center space-x-2">
                                          <span
                                            className="flex-1 select-all cursor-text truncate max-w-[150px]"
                                          >
                                            {purchase.account?.email || 'N/A'}
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => copyToClipboard(purchase.account?.email || '', 'Email')}
                                            data-testid={`button-copy-purchased-email-${globalIndex}`}
                                          >
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </TableCell>

                                      {/* Password */}
                                      <TableCell className="font-mono text-sm hidden sm:table-cell">
                                        <div className="flex items-center space-x-2">
                                          <span
                                            className="flex-1 select-all cursor-text"
                                            data-testid={`text-purchased-password-${globalIndex}`}
                                          >
                                            {visiblePasswords.has(purchase.transactionId)
                                              ? purchase.account?.password || 'N/A'
                                              : '••••••••••••'
                                            }
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => togglePasswordVisibility(purchase.transactionId)}
                                            data-testid={`button-toggle-purchased-password-${globalIndex}`}
                                          >
                                            {visiblePasswords.has(purchase.transactionId) ?
                                              <EyeOff className="w-3 h-3" /> :
                                              <Eye className="w-3 h-3" />
                                            }
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => copyToClipboard(purchase.account?.password || '', 'Password')}
                                            data-testid={`button-copy-purchased-password-${globalIndex}`}
                                          >
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </TableCell>

                                      {/* Recovery Email */}
                                      <TableCell className="font-mono text-sm hidden md:table-cell">
                                        {purchase.account?.recoveryEmail ? (
                                          <div className="flex items-center space-x-2">
                                            <span
                                              className="flex-1 select-all cursor-text truncate max-w-[120px]"
                                              data-testid={`text-purchased-recovery-${globalIndex}`}
                                            >
                                              {purchase.account.recoveryEmail}
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0"
                                              onClick={() => copyToClipboard(purchase.account.recoveryEmail, 'Recovery Email')}
                                              data-testid={`button-copy-purchased-recovery-${globalIndex}`}
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>

                                      {/* Category */}
                                      <TableCell className="text-center" data-testid={`text-purchased-category-${globalIndex}`}>
                                        <span className="font-medium">{purchase.category?.name || 'N/A'}</span>
                                      </TableCell>

                                      {/* Amount */}
                                      <TableCell className="text-center font-semibold" data-testid={`text-purchased-amount-${globalIndex}`}>
                                        ${purchase.amount}
                                      </TableCell>

                                      {/* Date */}
                                      <TableCell className="text-center" data-testid={`text-purchased-date-${globalIndex}`}>
                                        {new Date(purchase.createdAt).toLocaleDateString()}
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
                                              onClick={() => handleVerifyPurchase(purchase.transactionId)}
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
                                              onClick={() => handleReportPurchase(purchase.transactionId)}
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
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/buyer"] });
          }}
        />
      )}
    </div>
  );
}