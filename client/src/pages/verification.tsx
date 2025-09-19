import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportModal } from "@/components/ReportModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Check, TriangleAlert } from "lucide-react";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Verification() {
  const { transactionId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [verificationChecks, setVerificationChecks] = useState({
    canLogin: false,
    featuresWork: false,
    recoveryAccurate: false,
    matchesDescription: false,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: transaction, isLoading: transactionLoading } = useQuery({
    queryKey: [`/api/transactions/${transactionId}`],
    enabled: !!transactionId && isAuthenticated,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
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
      setLocation('/dashboard');
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading || transactionLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Transaction Not Found</h2>
            <Button onClick={() => setLocation('/dashboard')} data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hoursRemaining = transaction?.verificationDeadline 
    ? Math.max(0, differenceInHours(new Date(transaction.verificationDeadline), new Date()))
    : 0;

  const allChecksComplete = Object.values(verificationChecks).every(Boolean);

  const handleCheckChange = (key: string, checked: boolean) => {
    setVerificationChecks(prev => ({ ...prev, [key]: checked }));
  };

  const handleConfirmVerification = () => {
    if (!allChecksComplete) {
      toast({
        title: "Incomplete Verification",
        description: "Please complete all verification checks before confirming.",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-verification-title">Verify Your Purchase</CardTitle>
            <CardDescription>
              Confirm that the Gmail account is working properly
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Verification Timer */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">Verification Period Active</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300" data-testid="text-time-remaining">
                You have {hoursRemaining} hours remaining to verify this account
              </p>
            </div>

            {/* Account Details */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Purchase Details</h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <div className="font-mono" data-testid="text-category">{transaction?.category?.name || 'Gmail Account'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <div className="font-mono" data-testid="text-amount">${transaction?.amount || '0'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purchase Time:</span>
                    <div data-testid="text-purchase-time">
                      {transaction?.createdAt ? formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true }) : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="capitalize" data-testid="text-status">{transaction?.status || 'pending'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Verification Checklist</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="check-login"
                    checked={verificationChecks.canLogin}
                    onCheckedChange={(checked) => handleCheckChange('canLogin', checked as boolean)}
                    data-testid="checkbox-can-login"
                  />
                  <label htmlFor="check-login" className="text-sm">
                    I can successfully log into the Gmail account
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="check-features"
                    checked={verificationChecks.featuresWork}
                    onCheckedChange={(checked) => handleCheckChange('featuresWork', checked as boolean)}
                    data-testid="checkbox-features-work"
                  />
                  <label htmlFor="check-features" className="text-sm">
                    All account features are working properly
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="check-recovery"
                    checked={verificationChecks.recoveryAccurate}
                    onCheckedChange={(checked) => handleCheckChange('recoveryAccurate', checked as boolean)}
                    data-testid="checkbox-recovery-accurate"
                  />
                  <label htmlFor="check-recovery" className="text-sm">
                    Recovery information is accurate and accessible
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="check-description"
                    checked={verificationChecks.matchesDescription}
                    onCheckedChange={(checked) => handleCheckChange('matchesDescription', checked as boolean)}
                    data-testid="checkbox-matches-description"
                  />
                  <label htmlFor="check-description" className="text-sm">
                    Account matches the described specifications
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-border pt-6">
              <div className="flex space-x-4">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleConfirmVerification}
                  disabled={verifyMutation.isPending || !allChecksComplete}
                  data-testid="button-confirm-verification"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {verifyMutation.isPending ? "Confirming..." : "Confirm - Account Works Perfectly"}
                </Button>
                <Button 
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowReportModal(true)}
                  data-testid="button-report-issue"
                >
                  <TriangleAlert className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showReportModal && (
        <ReportModal
          transactionId={transactionId!}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setShowReportModal(false);
            setLocation('/dashboard');
          }}
        />
      )}
    </div>
  );
}
