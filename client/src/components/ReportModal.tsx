import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ReportModalProps {
  transactionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReportModal({ transactionId, onClose, onSuccess }: ReportModalProps) {
  const { toast } = useToast();
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  const reportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/transactions/${transactionId}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issueType,
          description,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "The seller will be notified and has 24 hours to respond.",
      });
      onSuccess();
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

  const handleSubmit = () => {
    if (!issueType || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an issue type and provide a description.",
        variant: "destructive",
      });
      return;
    }

    reportMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent data-testid="modal-report">
        <DialogHeader>
          <DialogTitle>Report Issue</DialogTitle>
          <DialogDescription>
          Report an issue with your recent purchase within 24 hours
        </DialogDescription>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm mb-1">
            Valid Dispute Reasons:
          </h4>
          <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
            <p>• Account credentials don't work</p>
            <p>• Account suspended immediately</p>
            <p>• Recovery email not accessible</p>
            <p>• Account doesn't match description</p>
            <p>• Missing features (Edu accounts)</p>
          </div>
        </div>
        </DialogHeader>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="issue-type">Issue Type</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger data-testid="select-issue-type">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cannot-login">Cannot login to account</SelectItem>
                <SelectItem value="password-incorrect">Password doesn't work</SelectItem>
                <SelectItem value="account-suspended">Account suspended/disabled</SelectItem>
                <SelectItem value="recovery-incorrect">Recovery information incorrect</SelectItem>
                <SelectItem value="description-mismatch">Account doesn't match description</SelectItem>
                <SelectItem value="other">Other issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail..."
              className="h-24"
              data-testid="textarea-description"
            />
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Your report will be sent to the seller immediately</p>
            <p>• The seller has 24 hours to respond</p>
            <p>• If the seller accepts the issue, you'll receive a full refund</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-testid="button-cancel-report"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            className="flex-1"
            onClick={handleSubmit}
            disabled={reportMutation.isPending}
            data-testid="button-submit-report"
          >
            {reportMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}