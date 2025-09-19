import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./manualAuth";
import { z } from "zod";
import { insertGmailAccountSchema, insertDisputeSchema, updateProfileSchema, updateDepositRequestSchema, insertWithdrawalRequestSchema, updateWithdrawalRequestSchema, createWithdrawalRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Logout endpoint
  app.get('/api/logout', async (req, res) => {
    try {
      (req.session as any).userId = null;
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Get the most up-to-date user data from database
      const freshUser = await storage.getUser(user.id);
      if (!freshUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: freshUser.id,
        phone: freshUser.phone,
        firstName: freshUser.firstName || '',
        lastName: freshUser.lastName || '',
        fullName: freshUser.fullName || `${freshUser.firstName || ''} ${freshUser.lastName || ''}`.trim() || 'User',
        email: freshUser.email,
        balance: freshUser.balance,
        profileImageUrl: freshUser.profileImageUrl,
        createdAt: freshUser.createdAt
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Gmail accounts
  // Get purchased accounts by category for current user
  app.get('/api/categories/:categoryId/my-purchases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const categoryId = req.params.categoryId;
      
      const transactions = await storage.getBuyerTransactionsByCategory(userId, categoryId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user purchases by category:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get('/api/categories/:categoryId/accounts', async (req, res) => {
    try {
      const accounts = await storage.getAvailableAccountsByCategory(req.params.categoryId);
      
      // Group accounts by seller and return seller info with account counts
      const sellerGroups = accounts.reduce((acc: any, account) => {
        if (!acc[account.sellerId]) {
          acc[account.sellerId] = {
            sellerId: account.sellerId,
            count: 0,
            accounts: []
          };
        }
        acc[account.sellerId].count++;
        acc[account.sellerId].accounts.push(account);
        return acc;
      }, {});

      // Get seller info for each group
      const sellersWithAccounts = await Promise.all(
        Object.values(sellerGroups).map(async (group: any) => {
          const seller = await storage.getUser(group.sellerId);
          return {
            seller: {
              id: seller?.id,
              email: seller?.email,
              fullName: seller?.fullName,
            },
            availableCount: group.count,
          };
        })
      );

      res.json(sellersWithAccounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post('/api/gmail-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accountsData = z.array(insertGmailAccountSchema.omit({ sellerId: true }).extend({
        categoryId: z.string(),
      })).parse(req.body);

      // Add seller ID to each account
      const accountsWithSeller = accountsData.map(account => ({
        ...account,
        sellerId: userId,
      }));

      const newAccounts = await storage.addGmailAccounts(accountsWithSeller);
      res.json(newAccounts);
    } catch (error) {
      console.error("Error adding accounts:", error);
      res.status(400).json({ message: "Failed to add accounts" });
    }
  });

  // Purchase flow
  app.post('/api/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { categoryId, sellerId, quantity = 1 } = z.object({
        categoryId: z.string(),
        sellerId: z.string(),
        quantity: z.number().min(1).max(50).optional(),
      }).parse(req.body);

      // Get category info
      const category = await storage.getCategoryBySlug(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Find available accounts from this seller in this category
      const availableAccounts = await storage.getAccountsByCategory(category.id, sellerId);
      const availableAccountsList = availableAccounts.filter(acc => acc.isAvailable && !acc.isSold);
      
      if (availableAccountsList.length === 0) {
        return res.status(400).json({ message: "No accounts available from this seller" });
      }

      if (availableAccountsList.length < quantity) {
        return res.status(400).json({ message: `Only ${availableAccountsList.length} accounts available from this seller` });
      }

      // Get buyer info and check balance
      const buyer = await storage.getUser(userId);
      if (!buyer) {
        return res.status(404).json({ message: "User not found" });
      }

      const buyerBalance = parseFloat(buyer.balance || '0');
      const pricePerAccount = parseFloat(category.sellPrice);
      const totalPrice = pricePerAccount * quantity;

      if (buyerBalance < totalPrice) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Select the accounts to purchase
      const accountsToPurchase = availableAccountsList.slice(0, quantity);
      
      // Deduct money from buyer
      await storage.updateUserBalance(userId, (-totalPrice).toString());

      // Process each account purchase
      const transactions = [];
      const purchasedCredentials = [];

      for (const account of accountsToPurchase) {
        // Mark account as sold
        await storage.markAccountAsSold(account.id);

        // Create transaction with 24-hour verification deadline
        const verificationDeadline = new Date();
        verificationDeadline.setHours(verificationDeadline.getHours() + 24);

        const transaction = await storage.createTransaction({
          buyerId: userId,
          sellerId: sellerId,
          accountId: account.id,
          categoryId: category.id,
          amount: category.sellPrice,
          status: 'pending',
          verificationDeadline,
          isVerified: false,
          isDisputed: false,
        });

        transactions.push(transaction);
        purchasedCredentials.push({
          transactionId: transaction.id,
          email: account.email,
          password: account.password,
          recoveryEmail: account.recoveryEmail,
        });
      }

      // Create notifications for purchase
      try {
        // Notify buyer of purchase
        await storage.createNotification({
          userId: userId,
          type: 'purchase',
          title: 'Account Purchased Successfully',
          message: `You have successfully purchased ${quantity} account(s) from ${category.name} category. Total amount: $${totalPrice.toFixed(2)}`,
          relatedId: transactions[0]?.id
        });

        // Notify seller of sale
        await storage.createNotification({
          userId: sellerId,
          type: 'account_sold',
          title: 'Account Sold',
          message: `${quantity} of your account(s) from ${category.name} category have been sold. Amount earned: $${totalPrice.toFixed(2)}`,
          relatedId: transactions[0]?.id
        });
      } catch (notificationError) {
        console.error("Error creating purchase notifications:", notificationError);
        // Don't fail the transaction for notification errors
      }

      // Return account credentials
      res.json({
        transactions: transactions.map(t => t.id),
        accounts: purchasedCredentials,
        totalAmount: totalPrice,
        quantity: quantity,
        verificationDeadline: transactions[0]?.verificationDeadline,
      });
    } catch (error) {
      console.error("Error processing purchase:", error);
      res.status(500).json({ message: "Failed to process purchase" });
    }
  });

  // Get single transaction by ID
  app.get('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;

      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Get category and account details for the transaction
      const category = await storage.getCategoryById(transaction.categoryId);
      const account = await storage.getGmailAccountById(transaction.accountId);
      
      res.json({
        ...transaction,
        category,
        account: transaction.buyerId === userId ? account : undefined, // Only show account details to buyer
      });
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  // Verification
  app.post('/api/transactions/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;

      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.buyerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Get category to get the buyPrice for seller payment
      const category = await storage.getCategoryById(transaction.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Update transaction as verified
      await storage.updateTransactionStatus(transactionId, 'verified', true);

      // Pay seller with buyPrice (not the full sellPrice)
      await storage.updateUserBalance(transaction.sellerId, category.buyPrice);

      res.json({ message: "Transaction verified successfully" });
    } catch (error) {
      console.error("Error verifying transaction:", error);
      res.status(500).json({ message: "Failed to verify transaction" });
    }
  });

  // Disputes
  app.post('/api/transactions/:id/dispute', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;
      const { issueType, description } = z.object({
        issueType: z.string(),
        description: z.string(),
      }).parse(req.body);

      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.buyerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Create dispute
      const dispute = await storage.createDispute({
        transactionId,
        buyerId: userId,
        sellerId: transaction.sellerId,
        issueType,
        description,
        status: 'pending',
        isResolved: false,
      });

      // Update transaction status
      await storage.updateTransactionStatus(transactionId, 'disputed');

      // Create notification for seller about dispute
      try {
        await storage.createNotification({
          userId: transaction.sellerId,
          type: 'dispute_created',
          title: 'New Dispute Created',
          message: `A buyer has created a dispute for transaction. Issue: ${issueType}`,
          relatedId: dispute.id
        });
      } catch (notificationError) {
        console.error("Error creating dispute notification:", notificationError);
      }

      res.json(dispute);
    } catch (error) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ message: "Failed to create dispute" });
    }
  });

  // Create Deposit Request
  app.post('/api/deposit-request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestData = z.object({
        amount: z.number().positive().max(1000), // Max $1000 per request
        paymentMethod: z.enum(['bkash', 'nagad']).optional(),
        transactionId: z.string().optional(),
        userPhone: z.string().optional(),
      }).parse(req.body);

      const depositRequest = await storage.createDepositRequest({
        userId,
        amount: requestData.amount.toString(),
        status: 'pending',
        ...(requestData.paymentMethod && { paymentMethod: requestData.paymentMethod }),
        ...(requestData.transactionId && { transactionId: requestData.transactionId }),
        ...(requestData.userPhone && { userPhone: requestData.userPhone }),
      });

      res.json({ 
        message: "Deposit request submitted successfully", 
        depositRequest 
      });
    } catch (error) {
      console.error("Error creating deposit request:", error);
      res.status(500).json({ message: "Failed to create deposit request" });
    }
  });

  // Get User's Deposit Requests
  app.get('/api/deposit-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const depositRequests = await storage.getDepositRequestsByUser(userId);
      res.json(depositRequests);
    } catch (error) {
      console.error("Error fetching deposit requests:", error);
      res.status(500).json({ message: "Failed to fetch deposit requests" });
    }
  });

  // Admin: Get All Deposit Requests
  // Admin authentication middleware
  const isAdminAuthenticated = async (req: any, res: any, next: any) => {
    if ((req.session as any)?.isAdmin === true && (req.session as any)?.userId) {
      // Set user for admin routes
      const user = await storage.getUser((req.session as any).userId);
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(403).json({ message: "Admin user not found" });
      }
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  };

  app.get('/api/admin/deposit-requests', isAdminAuthenticated, async (req: any, res) => {
    try {
      const depositRequests = await storage.getAllDepositRequests();
      res.json(depositRequests);
    } catch (error) {
      console.error("Error fetching all deposit requests:", error);
      res.status(500).json({ message: "Failed to fetch deposit requests" });
    }
  });

  // Admin: Get Pending Deposit Requests
  app.get('/api/admin/deposit-requests/pending', isAdminAuthenticated, async (req: any, res) => {
    try {
      const depositRequests = await storage.getPendingDepositRequests();
      res.json(depositRequests);
    } catch (error) {
      console.error("Error fetching pending deposit requests:", error);
      res.status(500).json({ message: "Failed to fetch pending deposit requests" });
    }
  });

  // Admin: Approve/Reject Deposit Request
  app.patch('/api/admin/deposit-requests/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const adminUserId = req.user.id;
      const { id } = req.params;
      const updateData = updateDepositRequestSchema.parse(req.body);

      const updatedRequest = await storage.updateDepositRequest(id, {
        ...updateData,
        adminId: adminUserId,
      });

      if (!updatedRequest) {
        return res.status(404).json({ message: "Deposit request not found" });
      }

      res.json({ 
        message: `Deposit request ${updateData.status} successfully`, 
        depositRequest: updatedRequest 
      });
    } catch (error) {
      console.error("Error updating deposit request:", error);
      res.status(500).json({ message: "Failed to update deposit request" });
    }
  });

  // Create Withdrawal Request
  app.post('/api/withdrawal-request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user to check balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const requestData = createWithdrawalRequestSchema.parse(req.body);
      const requestAmount = parseFloat(requestData.amount);
      const userBalance = parseFloat(user.balance);

      // Check if user has enough balance
      if (requestAmount > userBalance) {
        return res.status(400).json({ 
          message: "Insufficient balance for withdrawal", 
          availableBalance: user.balance 
        });
      }

      // Minimum withdrawal amount check
      if (requestAmount < 5) {
        return res.status(400).json({ 
          message: "Minimum withdrawal amount is $5" 
        });
      }

      const withdrawalRequest = await storage.createWithdrawalRequest({
        userId,
        amount: requestData.amount,
        status: 'pending',
        paymentMethod: requestData.paymentMethod,
        accountNumber: requestData.accountNumber,
        accountName: requestData.accountName,
        ...(requestData.bankName && { bankName: requestData.bankName }),
      });

      res.json({ 
        message: "Withdrawal request submitted successfully", 
        withdrawalRequest 
      });
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  // Get User's Withdrawal Requests
  app.get('/api/withdrawal-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const withdrawalRequests = await storage.getWithdrawalRequestsByUser(userId);
      res.json(withdrawalRequests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  // Admin: Get All Withdrawal Requests
  app.get('/api/admin/withdrawal-requests', isAdminAuthenticated, async (req: any, res) => {
    try {
      const withdrawalRequests = await storage.getAllWithdrawalRequests();
      res.json(withdrawalRequests);
    } catch (error) {
      console.error("Error fetching all withdrawal requests:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  // Admin: Approve/Reject Withdrawal Request
  app.patch('/api/admin/withdrawal-requests/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const adminUserId = req.user.id;
      const { id } = req.params;
      const updateData = updateWithdrawalRequestSchema.parse(req.body);

      const updatedRequest = await storage.updateWithdrawalRequest(id, {
        ...updateData,
        adminId: adminUserId,
      });

      if (!updatedRequest) {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }

      res.json({ 
        message: `Withdrawal request ${updateData.status} successfully`, 
        withdrawalRequest: updatedRequest 
      });
    } catch (error) {
      console.error("Error updating withdrawal request:", error);
      res.status(500).json({ message: "Failed to update withdrawal request" });
    }
  });

  // Profile Update
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = updateProfileSchema.parse(req.body);

      const updatedUser = await storage.upsertUser({
        id: userId,
        ...profileData,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Dashboard data
  app.get('/api/dashboard/buyer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const [stats, transactions] = await Promise.all([
        storage.getBuyerStats(userId),
        storage.getBuyerTransactions(userId),
      ]);

      res.json({ stats, transactions });
    } catch (error) {
      console.error("Error fetching buyer dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get('/api/dashboard/seller', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const [stats, inventory, transactions] = await Promise.all([
        storage.getSellerStats(userId),
        storage.getSellerInventory(userId),
        storage.getSellerTransactions(userId),
      ]);

      res.json({ stats, inventory, transactions });
    } catch (error) {
      console.error("Error fetching seller dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get('/api/seller/disputes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const disputes = await storage.getDisputesBySeller(userId);
      res.json(disputes);
    } catch (error) {
      console.error("Error fetching seller disputes:", error);
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  app.post('/api/disputes/:id/respond', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const disputeId = req.params.id;
      const { action } = z.object({
        action: z.enum(['accept', 'reject'])
      }).parse(req.body);

      // Get dispute to verify seller ownership
      const disputes = await storage.getDisputesByTransaction(''); // We'll get by seller instead
      const sellerDisputes = await storage.getDisputesBySeller(userId);
      const dispute = sellerDisputes.find(d => d.id === disputeId);
      
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found or not authorized" });
      }

      if (dispute.status !== 'pending') {
        return res.status(400).json({ message: "Dispute has already been responded to" });
      }

      if (action === 'accept') {
        // Process refund
        await storage.processRefund(dispute.transactionId, 'Dispute accepted by seller');
        // Update dispute status
        await storage.updateDisputeStatus(disputeId, 'accepted', 'Seller accepted the dispute and processed refund');
      } else {
        // Reject dispute - treat as verified transaction and pay seller
        await storage.updateDisputeStatus(disputeId, 'rejected', 'Seller rejected the dispute claim');
        
        // Get transaction and category to pay seller
        const transaction = await storage.getTransactionById(dispute.transactionId);
        if (transaction) {
          const category = await storage.getCategoryById(transaction.categoryId);
          if (category) {
            // Update transaction as verified
            await storage.updateTransactionStatus(dispute.transactionId, 'verified', true);
            // Pay seller with buyPrice
            await storage.updateUserBalance(transaction.sellerId, category.buyPrice);
          }
        }
      }

      res.json({ message: `Dispute ${action}ed successfully` });
    } catch (error) {
      console.error(`Error responding to dispute:`, error);
      res.status(500).json({ message: "Failed to respond to dispute" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAdminAuthenticated, async (req, res) => {
    try {
      // Get overall platform statistics
      const [
        categories,
        totalUsers,
        totalTransactions,
        totalDisputes,
        totalRevenue,
        pendingVerifications
      ] = await Promise.all([
        storage.getCategories(),
        storage.getTotalUsers(),
        storage.getTotalTransactions(),
        storage.getTotalDisputes(),
        storage.getTotalRevenue(),
        storage.getPendingVerifications()
      ]);

      const stats = {
        totalUsers,
        totalCategories: categories.length,
        totalTransactions,
        totalDisputes,
        totalRevenue: totalRevenue.toString(),
        pendingVerifications,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', isAdminAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/categories', isAdminAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching admin categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/admin/recent-activity', isAdminAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getRecentActivity();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  app.post('/api/admin/categories', isAdminAuthenticated, async (req, res) => {
    try {
      const categoryData = req.body;
      const newCategory = await storage.createCategory(categoryData);
      res.json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/admin/categories/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const categoryData = req.body;
      const updatedCategory = await storage.updateCategory(id, categoryData);
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/admin/categories/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.post('/api/admin/populate-categories', isAdminAuthenticated, async (req, res) => {
    try {
      const gmailCategories = [
        {
          name: "Fresh Gmail",
          slug: "fresh-gmail",
          description: "Brand new Gmail accounts with no previous usage history. Perfect for new projects and campaigns.",
          buyPrice: "10.39",
          sellPrice: "12.99",
          icon: "Mail",
          iconColor: "green",
        },
        {
          name: "Aged Gmail",
          slug: "aged-gmail",
          description: "Well-aged Gmail accounts (6+ months old) with established history. Great for trusted communications.",
          buyPrice: "19.99",
          sellPrice: "24.99",
          icon: "Clock",
          iconColor: "blue",
        },
        {
          name: "Used Gmail",
          slug: "used-gmail",
          description: "Previously used Gmail accounts with activity history. Cost-effective option for general use.",
          buyPrice: "7.19",
          sellPrice: "8.99",
          icon: "User",
          iconColor: "orange",
        },
        {
          name: "Edu Gmail",
          slug: "edu-gmail",
          description: "Educational Gmail accounts (.edu domains) with student benefits and unlimited Google Drive storage.",
          buyPrice: "36.79",
          sellPrice: "45.99",
          icon: "GraduationCap",
          iconColor: "purple",
        },
        {
          name: "Bulk Gmail",
          slug: "bulk-gmail",
          description: "Large quantity Gmail accounts for bulk operations. Discounted rates for volume purchases.",
          buyPrice: "5.59",
          sellPrice: "6.99",
          icon: "Package",
          iconColor: "red",
        },
        {
          name: "Temporary Gmail",
          slug: "temporary-gmail",
          description: "Short-term Gmail accounts for temporary projects and one-time use. Valid for 30 days.",
          buyPrice: "3.19",
          sellPrice: "3.99",
          icon: "Timer",
          iconColor: "yellow",
        },
        {
          name: "PVA Gmail",
          slug: "pva-gmail",
          description: "Phone Verified Accounts - Gmail accounts verified with real phone numbers for maximum security.",
          buyPrice: "15.19",
          sellPrice: "18.99",
          icon: "Shield",
          iconColor: "indigo",
        },
        {
          name: "Non-PVA Gmail",
          slug: "non-pva-gmail",
          description: "Gmail accounts without phone verification. Budget-friendly option for basic needs.",
          buyPrice: "4.79",
          sellPrice: "5.99",
          icon: "MailX",
          iconColor: "gray",
        }
      ];

      const createdCategories = [];
      for (const categoryData of gmailCategories) {
        const category = await storage.createCategory({
          ...categoryData,
          isActive: true,
        });
        createdCategories.push(category);
      }

      res.json({
        message: "Categories populated successfully",
        categories: createdCategories
      });
    } catch (error) {
      console.error("Error populating categories:", error);
      res.status(500).json({ message: "Failed to populate categories" });
    }
  });

  app.get('/api/admin/transactions', isAdminAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/disputes', isAdminAuthenticated, async (req, res) => {
    try {
      const disputes = await storage.getAllDisputes();
      res.json(disputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  // Admin authentication endpoints
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check admin credentials
      if (username === 'sihab' && password === 'sb-mail-sb') {
        // Find admin user in database or create default admin user
        let adminUser = await storage.getUserByEmail('admin@sb-mail.com');
        if (!adminUser) {
          // Create default admin user if doesn't exist
          adminUser = await storage.upsertUser({
            email: 'admin@sb-mail.com',
            phone: '+8801000000000',
            fullName: 'Admin User',
            balance: '0'
          });
        }
        
        // Set admin session
        (req.session as any).isAdmin = true;
        (req.session as any).adminUser = username;
        (req.session as any).userId = adminUser.id;
        
        res.json({ success: true, message: "Admin login successful" });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  app.post('/api/admin/logout', async (req, res) => {
    try {
      (req.session as any).isAdmin = false;
      (req.session as any).adminUser = null;
      (req.session as any).userId = null;
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Error during admin logout:", error);
      res.status(500).json({ success: false, message: "Logout failed" });
    }
  });

  app.get('/api/admin/check', async (req, res) => {
    try {
      const isAdmin = (req.session as any)?.isAdmin === true;
      res.json({ isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.json({ isAdmin: false });
    }
  });

  // Notification endpoints
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
