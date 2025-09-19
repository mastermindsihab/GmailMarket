import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Eye, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Dispute {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  issueType: string;
  description: string;
  status: string;
  sellerResponse?: string;
  isResolved: boolean;
  createdAt: string;
  transaction: {
    amount: string;
    category: {
      name: string;
    };
  };
  buyer: {
    email: string;
  };
  seller: {
    email: string;
  };
}

export default function AdminDisputes() {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ['/api/admin/disputes'],
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string; status: string; resolution: string }) =>
      apiRequest(`/api/admin/disputes/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ status, resolution }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes'] });
      setSelectedDispute(null);
      setResolution("");
      toast({
        title: "Success",
        description: "Dispute resolved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "accepted":
        return <Badge variant="default">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "resolved":
        return <Badge variant="outline">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleResolve = (status: string) => {
    if (!selectedDispute || !resolution.trim()) return;
    
    resolveMutation.mutate({
      id: selectedDispute.id,
      status,
      resolution,
    });
  };

  return (
    <div className="p-6" data-testid="admin-disputes">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dispute Resolution</h1>
        <p className="text-muted-foreground">Manage and resolve customer disputes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Disputes</CardTitle>
          <CardDescription>
            Total disputes: {disputes?.length || 0}
            {disputes && (
              <span className="ml-4">
                Pending: {disputes.filter(d => d.status === 'pending').length}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute ID</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes?.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-mono text-sm">
                          {dispute.id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dispute.issueType}</div>
                        <div className="text-sm text-muted-foreground">
                          {dispute.transaction.category.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{dispute.buyer.email}</TableCell>
                    <TableCell>{dispute.seller.email}</TableCell>
                    <TableCell>
                      <span className="font-medium">${dispute.transaction.amount}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(dispute.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDispute(dispute)}
                            data-testid={`button-view-dispute-${dispute.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Dispute Details</DialogTitle>
                            <DialogDescription>
                              Review and resolve this dispute
                            </DialogDescription>
                          </DialogHeader>
                          {selectedDispute && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Issue Type</label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedDispute.issueType}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Amount</label>
                                  <p className="text-sm text-muted-foreground">
                                    ${selectedDispute.transaction.amount}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {selectedDispute.description}
                                </p>
                              </div>
                              {selectedDispute.sellerResponse && (
                                <div>
                                  <label className="text-sm font-medium">Seller Response</label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {selectedDispute.sellerResponse}
                                  </p>
                                </div>
                              )}
                              {selectedDispute.status === 'pending' && (
                                <div>
                                  <label className="text-sm font-medium">Admin Resolution</label>
                                  <Textarea
                                    placeholder="Provide your resolution comments..."
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    className="mt-1"
                                    data-testid="textarea-resolution"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          <DialogFooter>
                            {selectedDispute?.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleResolve('rejected')}
                                  disabled={resolveMutation.isPending || !resolution.trim()}
                                  data-testid="button-reject-dispute"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleResolve('accepted')}
                                  disabled={resolveMutation.isPending || !resolution.trim()}
                                  data-testid="button-accept-dispute"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept & Refund
                                </Button>
                              </div>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}