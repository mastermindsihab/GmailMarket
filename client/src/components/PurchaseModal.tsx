import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface PurchaseModalProps {
  category: any;
  seller: any;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export function PurchaseModal({ category, seller, onClose, onSuccess }: PurchaseModalProps) {
  const { toast } = useToast();

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/purchase", {
        categoryId: category.slug,
        sellerId: seller.seller.id,
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Purchase Successful",
        description: "Your Gmail account is ready to use!",
      });
      onSuccess(result);
    },
    onError: (error: Error) => {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to complete purchase. Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent data-testid="modal-purchase">
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            Review your purchase details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mb-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Category:</span>
              <span data-testid="text-modal-category">{category.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Delivery:</span>
              <span data-testid="text-modal-delivery" className="text-green-600">
                Instant
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Available:</span>
              <span data-testid="text-modal-available">{seller.availableCount} accounts</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Price:</span>
              <span className="text-xl font-bold text-primary" data-testid="text-modal-price">${category.sellPrice}</span>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Purchase Guidelines:
            </h4>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <p>• Payment deducted immediately from balance</p>
              <p>• Credentials delivered instantly</p>
              <p>• 24 hours to verify & report issues</p>
              <p>• Change password immediately after purchase</p>
              <p>• Use accounts for legitimate purposes only</p>
              <p>• No refund after verification or 24 hours</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Important Notice:
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• All sales are final after verification</p>
              <p>• Accounts are for single-user only</p>
              <p>• Follow Gmail Terms of Service</p>
              <p>• Report non-working accounts immediately</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-testid="button-cancel-purchase"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => purchaseMutation.mutate()}
            disabled={purchaseMutation.isPending}
            data-testid="button-confirm-purchase"
          >
            {purchaseMutation.isPending ? "Processing..." : "Confirm Purchase"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}