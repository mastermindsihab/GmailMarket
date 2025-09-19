import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Eye } from "lucide-react";
import { useState } from "react";

interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  accountId: string;
  categoryId: string;
  amount: string;
  status: string;
  isVerified: boolean;
  isDisputed: boolean;
  createdAt: string;
  buyer: {
    id: string;
    email: string;
  };
  seller: {
    id: string;
    email: string;
  };
  category: {
    name: string;
  };
}

export default function AdminTransactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions'],
  });

  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = 
      transaction.buyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, isDisputed: boolean) => {
    if (isDisputed) {
      return <Badge variant="destructive">Disputed</Badge>;
    }
    
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "verified":
        return <Badge variant="default">Verified</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6" data-testid="admin-transactions">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Transaction Management</h1>
        <p className="text-muted-foreground">Monitor all platform transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Total transactions: {transactions?.length || 0}
          </CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-transactions"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
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
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {transaction.id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.buyer.email}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {transaction.buyerId.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.seller.email}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {transaction.sellerId.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.category.name}</TableCell>
                    <TableCell>
                      <span className="font-medium">${transaction.amount}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status, transaction.isDisputed)}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-view-transaction-${transaction.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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