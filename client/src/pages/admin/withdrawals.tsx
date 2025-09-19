import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, Wallet, Clock, Search, Filter } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: string;
  status: string;
  paymentMethod?: string;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  adminId?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function AdminWithdrawals() {
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: withdrawalRequests, isLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ['/api/admin/withdrawal-requests'],
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: 'approved' | 'rejected'; adminNote: string }) =>
      apiRequest(`/api/admin/withdrawal-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawal-requests'] });
      setSelectedRequest(null);
      setAdminNote("");
      toast({
        title: "Success",
        description: `Withdrawal request ${variables.status} successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update withdrawal request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: WithdrawalRequest) => {
    if (!adminNote.trim()) {
      toast({
        title: "Error",
        description: "Please add an admin note before approving",
        variant: "destructive",
      });
      return;
    }
    updateRequestMutation.mutate({
      id: request.id,
      status: 'approved',
      adminNote: adminNote.trim(),
    });
  };

  const handleReject = (request: WithdrawalRequest) => {
    if (!adminNote.trim()) {
      toast({
        title: "Error",
        description: "Please add a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    updateRequestMutation.mutate({
      id: request.id,
      status: 'rejected',
      adminNote: adminNote.trim(),
    });
  };

  const openDialog = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setAdminNote(request.adminNote || "");
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setAdminNote("");
  };

  const filteredRequests = withdrawalRequests?.filter((request) => {
    const matchesSearch = 
      request.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.amount.includes(searchTerm) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.accountName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const pendingRequests = withdrawalRequests?.filter(req => req.status === 'pending') || [];
  const totalAmount = withdrawalRequests?.reduce((sum, req) => sum + parseFloat(req.amount), 0) || 0;
  const approvedAmount = withdrawalRequests?.filter(req => req.status === 'approved')
    .reduce((sum, req) => sum + parseFloat(req.amount), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Withdrawal Management</h2>
        <p className="text-muted-foreground">Manage user withdrawal requests and process payouts</p>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
            Processing Guidelines:
          </h3>
          <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
            <p>• Verify account details before approval</p>
            <p>• Check user balance covers withdrawal amount</p>
            <p>• Add detailed notes for approval/rejection</p>
            <p>• Process within 72 hours maximum</p>
            <p>• Confirm payment sent before marking approved</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{withdrawalRequests?.length || 0}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>
              <Wallet className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Amount</p>
                <p className="text-2xl font-bold">${approvedAmount.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by email, amount, ID, account..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>
            {filteredRequests.length} requests found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Account Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.user.email}</p>
                          {(request.user.firstName || request.user.lastName) && (
                            <p className="text-sm text-muted-foreground">
                              {request.user.firstName} {request.user.lastName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold">${request.amount}</span>
                      </TableCell>
                      <TableCell>
                        <div className="capitalize">
                          {request.paymentMethod}
                          {request.bankName && (
                            <div className="text-sm text-muted-foreground">{request.bankName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{request.accountName}</div>
                          <div className="text-muted-foreground">{request.accountNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            request.status === 'approved' ? 'default' : 
                            request.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{new Date(request.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: '2-digit'
                          })}</div>
                          <div className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Withdrawal Request</DialogTitle>
            <DialogDescription>
              Review and process the withdrawal request from {selectedRequest?.user.email}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-lg font-semibold">${selectedRequest.amount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="capitalize">{selectedRequest.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                  <p>{selectedRequest.accountName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                  <p>{selectedRequest.accountNumber}</p>
                </div>
                {selectedRequest.bankName && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                    <p>{selectedRequest.bankName}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Request Date</label>
                  <p>{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <Badge 
                    variant={
                      selectedRequest.status === 'approved' ? 'default' : 
                      selectedRequest.status === 'rejected' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Admin Note *
                </label>
                <Textarea
                  placeholder={selectedRequest.status === 'pending' ? 
                    "Add a note about this withdrawal request (required for approval/rejection)" :
                    "Update admin note"
                  }
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>

              {selectedRequest.adminNote && selectedRequest.status !== 'pending' && (
                <div className="p-3 bg-muted rounded-md">
                  <label className="text-sm font-medium text-muted-foreground">Previous Admin Note</label>
                  <p className="text-sm mt-1">{selectedRequest.adminNote}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => selectedRequest && handleReject(selectedRequest)}
                  disabled={updateRequestMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => selectedRequest && handleApprove(selectedRequest)}
                  disabled={updateRequestMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve & Process
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}