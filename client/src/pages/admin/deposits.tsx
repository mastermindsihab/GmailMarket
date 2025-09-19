import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, DollarSign, Clock, Search, Filter } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface DepositRequest {
  id: string;
  userId: string;
  amount: string;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  userPhone?: string;
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

export default function AdminDeposits() {
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: depositRequests, isLoading } = useQuery<DepositRequest[]>({
    queryKey: ['/api/admin/deposit-requests'],
  });

  const { data: pendingRequests } = useQuery<DepositRequest[]>({
    queryKey: ['/api/admin/deposit-requests/pending'],
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: 'approved' | 'rejected'; adminNote: string }) =>
      apiRequest(`/api/admin/deposit-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deposit-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deposit-requests/pending'] });
      setSelectedRequest(null);
      setAdminNote("");
      toast({
        title: "Success",
        description: `Deposit request ${variables.status} successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update deposit request",
        variant: "destructive",
      });
    },
  });

  const handleAction = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status,
      adminNote,
    });
  };

  const filteredRequests = depositRequests?.filter(request => {
    const matchesSearch = 
      request.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.amount.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFullName = (user: DepositRequest['user']) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return name || 'Unknown User';
  };

  return (
    <div className="p-6" data-testid="admin-deposits">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Deposit Management</h1>
        <p className="text-muted-foreground">Review and approve user deposit requests</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{depositRequests?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${pendingRequests?.reduce((sum, req) => sum + parseFloat(req.amount), 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deposit Requests</CardTitle>
          <CardDescription>
            Manage all user deposit requests
          </CardDescription>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mt-3">
            <h4 className="font-semibold text-orange-800 dark:text-orange-200 text-sm mb-1">
              Approval Guidelines:
            </h4>
            <div className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
              <p>• Verify transaction ID for mobile money payments</p>
              <p>• Check phone number matches transaction</p>
              <p>• Confirm amount matches user's claim</p>
              <p>• Add detailed notes for all decisions</p>
              <p>• Process within 24 hours for good service</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-deposits"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Admin Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests?.map((request) => (
                  <TableRow key={request.id} data-testid={`row-deposit-${request.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getFullName(request.user)}</div>
                        <div className="text-sm text-muted-foreground">{request.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${request.amount}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {request.paymentMethod ? (
                          <Badge variant="outline" className="text-xs">
                            {request.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-24 truncate">
                        {request.transactionId || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {request.userPhone || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-32 truncate">
                        {request.adminNote || 'No note'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          data-testid={`button-view-${request.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredRequests?.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No deposit requests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Deposit Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject this deposit request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">User Details</div>
                <div className="text-sm text-muted-foreground">
                  <div>{getFullName(selectedRequest.user)}</div>
                  <div>{selectedRequest.user.email}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Request Details</div>
                <div className="text-sm text-muted-foreground">
                  <div>Amount: <span className="font-medium text-green-600">${selectedRequest.amount}</span></div>
                  <div>Requested: {formatDistanceToNow(new Date(selectedRequest.createdAt), { addSuffix: true })}</div>
                  <div>Status: {getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {/* Payment Details */}
              {(selectedRequest.paymentMethod || selectedRequest.transactionId || selectedRequest.userPhone) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Payment Details</div>
                  <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    {selectedRequest.paymentMethod && (
                      <div>Payment Method: <span className="font-medium">
                        {selectedRequest.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}
                      </span></div>
                    )}
                    {selectedRequest.transactionId && (
                      <div>Transaction ID: <span className="font-mono font-medium">{selectedRequest.transactionId}</span></div>
                    )}
                    {selectedRequest.userPhone && (
                      <div>User Phone: <span className="font-medium">{selectedRequest.userPhone}</span></div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="space-y-2">
                  <label htmlFor="adminNote" className="text-sm font-medium">
                    Admin Note (Optional)
                  </label>
                  <Textarea
                    id="adminNote"
                    placeholder="Add a note about your decision..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {selectedRequest.adminNote && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Previous Admin Note</div>
                  <div className="text-sm text-muted-foreground p-2 bg-gray-50 rounded">
                    {selectedRequest.adminNote}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <div className="flex space-x-2 w-full">
              <Button 
                variant="outline" 
                onClick={() => setSelectedRequest(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              {selectedRequest?.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction('rejected')}
                    disabled={updateRequestMutation.isPending}
                    className="flex-1"
                    data-testid="button-reject"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleAction('approved')}
                    disabled={updateRequestMutation.isPending}
                    className="flex-1"
                    data-testid="button-approve"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}