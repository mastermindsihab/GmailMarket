import {
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type GmailAccount,
  type InsertGmailAccount,
  type Transaction,
  type InsertTransaction,
  type Dispute,
  type InsertDispute,
  type DepositRequest,
  type InsertDepositRequest,
  type UpdateDepositRequest,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type UpdateWithdrawalRequest,
  type Notification,
  type InsertNotification,
  type UserDocument,
  type CategoryDocument,
  type GmailAccountDocument,
  type TransactionDocument,
  type DisputeDocument,
  type DepositRequestDocument,
  type WithdrawalRequestDocument,
  type NotificationDocument,
} from "@shared/schema";
import { db, connectToMongoDB } from "./db";
import { v4 as uuidv4 } from 'uuid';

export interface IStorage {
  // User operations (manual auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: UserDocument): Promise<User>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: string): Promise<User | undefined>;
  addBalance(userId: string, amount: string): Promise<User | undefined>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: InsertCategory): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;
  
  // Gmail account operations
  getAccountsByCategory(categoryId: string, sellerId?: string): Promise<GmailAccount[]>;
  getAvailableAccountsByCategory(categoryId: string): Promise<GmailAccount[]>;
  addGmailAccounts(accounts: InsertGmailAccount[]): Promise<GmailAccount[]>;
  getAccountById(id: string): Promise<GmailAccount | undefined>;
  markAccountAsSold(id: string): Promise<void>;
  getSellerInventory(sellerId: string): Promise<{ category: Category; count: number; totalSales: number; revenue: string }[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<(Transaction & { category: Category; buyer: Pick<User, 'id' | 'email'>; seller: Pick<User, 'id' | 'email'> })[]>;
  updateTransactionStatus(id: string, status: string, isVerified?: boolean): Promise<void>;
  getBuyerTransactions(buyerId: string): Promise<(Transaction & { category: Category; seller: Pick<User, 'id' | 'email'> })[]>;
  getSellerTransactions(sellerId: string): Promise<(Transaction & { category: Category; buyer: Pick<User, 'id' | 'email'> })[]>;
  getPendingTransactionsOlderThan(hours: number): Promise<Transaction[]>;
  
  // Dispute operations
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDisputesByTransaction(transactionId: string): Promise<Dispute[]>;
  getAllDisputes(): Promise<(Dispute & { transaction: Transaction & { category: Category }; buyer: Pick<User, 'id' | 'email'>; seller: Pick<User, 'id' | 'email'> })[]>;
  getDisputesBySeller(sellerId: string): Promise<(Dispute & { transaction: Transaction; buyer: Pick<User, 'id' | 'email'> })[]>;
  updateDisputeStatus(id: string, status: string, sellerResponse?: string): Promise<void>;
  getPendingDisputesOlderThan(hours: number): Promise<Dispute[]>;
  processRefund(transactionId: string, reason: string): Promise<void>;
  
  // Deposit request operations
  createDepositRequest(request: InsertDepositRequest): Promise<DepositRequest>;
  getDepositRequestsByUser(userId: string): Promise<DepositRequest[]>;
  getAllDepositRequests(): Promise<(DepositRequest & { user: Pick<User, 'id' | 'email' | 'fullName'> })[]>;
  getPendingDepositRequests(): Promise<(DepositRequest & { user: Pick<User, 'id' | 'email' | 'fullName'> })[]>;
  updateDepositRequest(id: string, update: UpdateDepositRequest & { adminId: string }): Promise<DepositRequest | undefined>;
  getDepositRequestById(id: string): Promise<DepositRequest | undefined>;
  
  // Dashboard stats
  getBuyerStats(buyerId: string): Promise<{
    totalPurchases: number;
    totalSpent: string;
    pendingVerification: number;
    successRate: number;
  }>;
  
  getSellerStats(sellerId: string): Promise<{
    totalSales: string;
    activeListings: number;
    pendingOrders: number;
    successRate: number;
  }>;

  // Withdrawal operations
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getWithdrawalRequestsByUser(userId: string): Promise<WithdrawalRequest[]>;
  getAllWithdrawalRequests(): Promise<(WithdrawalRequest & { user: Pick<User, 'id' | 'email' | 'fullName'> })[]>;
  updateWithdrawalRequest(id: string, update: UpdateWithdrawalRequest & { adminId: string }): Promise<WithdrawalRequest | undefined>;
  getWithdrawalRequestById(id: string): Promise<WithdrawalRequest | undefined>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize MongoDB connection
    connectToMongoDB().catch(console.error);
    // Auto-populate categories if none exist
    this.initializeCategories();
  }

  private async initializeCategories() {
    try {
      const existingCategories = await this.getCategories();
      if (existingCategories.length === 0) {
        const gmailCategories = [
          {
            name: "Fresh Gmail",
            slug: "fresh-gmail",
            description: "Brand new Gmail accounts with no previous usage history. Perfect for new projects and campaigns.",
            buyPrice: "8.99",  // Price paid to sellers
            sellPrice: "12.99", // Price charged to buyers
            icon: "Mail",
            iconColor: "green",
          },
          {
            name: "Aged Gmail",
            slug: "aged-gmail",
            description: "Well-aged Gmail accounts (6+ months old) with established history. Great for trusted communications.",
            buyPrice: "18.99", // Price paid to sellers
            sellPrice: "24.99", // Price charged to buyers
            icon: "Clock",
            iconColor: "blue",
          },
          {
            name: "Used Gmail",
            slug: "used-gmail",
            description: "Previously used Gmail accounts with activity history. Cost-effective option for general use.",
            buyPrice: "6.99",  // Price paid to sellers
            sellPrice: "8.99",  // Price charged to buyers
            icon: "User",
            iconColor: "orange",
          },
          {
            name: "Edu Gmail",
            slug: "edu-gmail",
            description: "Educational Gmail accounts (.edu domains) with student benefits and unlimited Google Drive storage.",
            buyPrice: "35.99", // Price paid to sellers
            sellPrice: "45.99", // Price charged to buyers
            icon: "GraduationCap",
            iconColor: "purple",
          },
          {
            name: "Bulk Gmail",
            slug: "bulk-gmail",
            description: "Large quantity Gmail accounts for bulk operations. Discounted rates for volume purchases.",
            buyPrice: "4.99",  // Price paid to sellers
            sellPrice: "6.99",  // Price charged to buyers
            icon: "Package",
            iconColor: "red",
          },
          {
            name: "Temporary Gmail",
            slug: "temporary-gmail",
            description: "Short-term Gmail accounts for temporary projects and one-time use. Valid for 30 days.",
            buyPrice: "2.99",  // Price paid to sellers
            sellPrice: "3.99",  // Price charged to buyers
            icon: "Timer",
            iconColor: "yellow",
          },
          {
            name: "PVA Gmail",
            slug: "pva-gmail",
            description: "Phone Verified Accounts - Gmail accounts verified with real phone numbers for maximum security.",
            buyPrice: "14.99", // Price paid to sellers
            sellPrice: "18.99", // Price charged to buyers
            icon: "Shield",
            iconColor: "indigo",
          },
          {
            name: "Non-PVA Gmail",
            slug: "non-pva-gmail",
            description: "Gmail accounts without phone verification. Budget-friendly option for basic needs.",
            buyPrice: "3.99",  // Price paid to sellers
            sellPrice: "5.99",  // Price charged to buyers
            icon: "MailX",
            iconColor: "gray",
          }
        ];

        for (const categoryData of gmailCategories) {
          await this.createCategory({ ...categoryData, isActive: true });
        }
        console.log("Gmail categories initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing categories:", error);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await db.collection<UserDocument>('users').findOne({ id });
    
    // If user exists but doesn't have firstName/lastName, populate from fullName
    if (user && (!user.firstName || !user.lastName) && user.fullName) {
      const nameParts = user.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Update the user with firstName and lastName
      await db.collection<UserDocument>('users').updateOne(
        { id },
        { 
          $set: { 
            firstName: firstName,
            lastName: lastName,
            updatedAt: new Date()
          }
        }
      );
      
      // Return updated user
      return {
        ...user,
        firstName,
        lastName
      };
    }
    
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const user = await db.collection<UserDocument>('users').findOne({ phone });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await db.collection<UserDocument>('users').findOne({ email });
    return user || undefined;
  }

  async createUser(userData: UserDocument): Promise<User> {
    const result = await db.collection<UserDocument>('users').insertOne(userData);
    return { ...userData, _id: result.insertedId };
  }

  async getAllUsers(): Promise<User[]> {
    const users = await db.collection<UserDocument>('users')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return users;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    
    // For updates (not creation), only update provided fields
    const updateFields: any = {
      ...userData,
      updatedAt: now,
    };

    // Remove undefined values to prevent overwriting existing data
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key as keyof typeof updateFields] === undefined) {
        delete updateFields[key as keyof typeof updateFields];
      }
    });

    // If firstName and lastName are provided, also update fullName
    if (updateFields.firstName || updateFields.lastName) {
      const existingUser = await this.getUser(userData.id);
      const firstName = updateFields.firstName || existingUser?.firstName || '';
      const lastName = updateFields.lastName || existingUser?.lastName || '';
      updateFields.fullName = `${firstName} ${lastName}`.trim() || existingUser?.fullName || 'User';
    }

    const result = await db.collection<UserDocument>('users').findOneAndUpdate(
      { id: userData.id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return result!;
  }

  async updateUserBalance(userId: string, amount: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const currentBalance = parseFloat(user.balance);
    const newBalance = (currentBalance + parseFloat(amount)).toString();

    const result = await db.collection<UserDocument>('users').findOneAndUpdate(
      { id: userId },
      { 
        $set: { 
          balance: newBalance,
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    return result || undefined;
  }

  async addBalance(userId: string, amount: string): Promise<User | undefined> {
    return this.updateUserBalance(userId, amount);
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    const categories = await db.collection<CategoryDocument>('categories')
      .find({ isActive: true })
      .toArray();
    return categories;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const category = await db.collection<CategoryDocument>('categories').findOne({ slug });
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const categoryDoc: CategoryDocument = {
      id: uuidv4(),
      ...category,
      isActive: category.isActive ?? true,
      createdAt: new Date(),
    };

    await db.collection<CategoryDocument>('categories').insertOne(categoryDoc);
    return categoryDoc;
  }

  async updateCategory(id: string, categoryData: InsertCategory): Promise<Category | undefined> {
    const result = await db.collection<CategoryDocument>('categories').findOneAndUpdate(
      { id },
      { $set: categoryData },
      { returnDocument: 'after' }
    );

    return result || undefined;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.collection<CategoryDocument>('categories').deleteOne({ id });
  }

  // Gmail account operations
  async getAccountsByCategory(categoryId: string, sellerId?: string): Promise<GmailAccount[]> {
    const filter: any = { categoryId };
    if (sellerId) {
      filter.sellerId = sellerId;
    }
    
    const accounts = await db.collection<GmailAccountDocument>('gmailAccounts')
      .find(filter)
      .toArray();
    return accounts;
  }

  async getAvailableAccountsByCategory(categoryId: string): Promise<GmailAccount[]> {
    const accounts = await db.collection<GmailAccountDocument>('gmailAccounts')
      .find({
        categoryId,
        isAvailable: true,
        isSold: false
      })
      .toArray();
    return accounts;
  }

  async addGmailAccounts(accounts: InsertGmailAccount[]): Promise<GmailAccount[]> {
    const accountDocs: GmailAccountDocument[] = accounts.map(account => ({
      id: uuidv4(),
      ...account,
      isAvailable: true,
      isSold: false,
      createdAt: new Date(),
    }));

    await db.collection<GmailAccountDocument>('gmailAccounts').insertMany(accountDocs);
    return accountDocs;
  }

  async getAccountById(id: string): Promise<GmailAccount | undefined> {
    const account = await db.collection<GmailAccountDocument>('gmailAccounts').findOne({ id });
    return account || undefined;
  }

  async getGmailAccountById(id: string): Promise<GmailAccount | undefined> {
    const account = await db.collection<GmailAccountDocument>('gmailAccounts').findOne({ id });
    return account || undefined;
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const category = await db.collection<CategoryDocument>('categories').findOne({ id });
    return category || undefined;
  }

  async markAccountAsSold(id: string): Promise<void> {
    await db.collection<GmailAccountDocument>('gmailAccounts').updateOne(
      { id },
      { 
        $set: { 
          isSold: true, 
          isAvailable: false 
        } 
      }
    );
  }

  async getSellerInventory(sellerId: string): Promise<{ category: Category; count: number; totalSales: number; revenue: string }[]> {
    const categories = await this.getCategories();
    const results = [];

    for (const category of categories) {
      // Count available accounts
      const accountCount = await db.collection<GmailAccountDocument>('gmailAccounts').countDocuments({
        categoryId: category.id,
        sellerId,
        isAvailable: true
      });

      // Count sales and revenue
      const salesAggregation = await db.collection<TransactionDocument>('transactions')
        .aggregate([
          {
            $match: {
              sellerId,
              categoryId: category.id,
              status: 'verified'
            }
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              revenue: { $sum: { $toDouble: "$amount" } }
            }
          }
        ]).toArray();

      const salesData = salesAggregation[0] || { totalSales: 0, revenue: 0 };

      results.push({
        category,
        count: accountCount,
        totalSales: salesData.totalSales,
        revenue: salesData.revenue.toString()
      });
    }

    return results;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const transactionDoc: TransactionDocument = {
      id: uuidv4(),
      ...transaction,
      status: transaction.status || 'pending',
      isVerified: transaction.isVerified || false,
      isDisputed: transaction.isDisputed || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection<TransactionDocument>('transactions').insertOne(transactionDoc);
    return transactionDoc;
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const transaction = await db.collection<TransactionDocument>('transactions').findOne({ id });
    return transaction || undefined;
  }

  async getAllTransactions(): Promise<(Transaction & { category: Category; buyer: Pick<User, 'id' | 'email'>; seller: Pick<User, 'id' | 'email'> })[]> {
    const transactions = await db.collection<TransactionDocument>('transactions')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const results = [];
    for (const transaction of transactions) {
      const category = await db.collection<CategoryDocument>('categories').findOne({ id: transaction.categoryId });
      const buyer = await this.getUser(transaction.buyerId);
      const seller = await this.getUser(transaction.sellerId);
      
      if (category && buyer && seller) {
        results.push({
          ...transaction,
          category,
          buyer: { id: buyer.id, email: buyer.email },
          seller: { id: seller.id, email: seller.email }
        });
      }
    }

    return results;
  }

  async updateTransactionStatus(id: string, status: string, isVerified?: boolean): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (isVerified !== undefined) {
      updateData.isVerified = isVerified;
    }
    
    await db.collection<TransactionDocument>('transactions').updateOne(
      { id },
      { $set: updateData }
    );
  }

  async getBuyerTransactions(buyerId: string): Promise<(Transaction & { category: Category; seller: Pick<User, 'id' | 'email'>; account: GmailAccount })[]> {
    const transactions = await db.collection<TransactionDocument>('transactions')
      .find({ buyerId })
      .sort({ createdAt: -1 })
      .toArray();

    const results = [];
    for (const transaction of transactions) {
      const category = await db.collection<CategoryDocument>('categories').findOne({ id: transaction.categoryId });
      const seller = await this.getUser(transaction.sellerId);
      const account = await db.collection<GmailAccountDocument>('gmailAccounts').findOne({ id: transaction.accountId });
      
      if (category && seller && account) {
        results.push({
          ...transaction,
          category,
          seller: { id: seller.id, email: seller.email },
          account
        });
      }
    }

    return results;
  }

  async getPendingTransactionsOlderThan(hours: number): Promise<Transaction[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    const transactions = await db.collection<TransactionDocument>('transactions')
      .find({ 
        status: 'pending',
        createdAt: { $lt: cutoffTime }
      })
      .toArray();

    return transactions;
  }

  async getBuyerTransactionsByCategory(buyerId: string, categoryId: string): Promise<(Transaction & { category: Category; seller: Pick<User, 'id' | 'email'>; account: GmailAccount })[]> {
    const transactions = await db.collection<TransactionDocument>('transactions')
      .find({ buyerId, categoryId })
      .sort({ createdAt: -1 })
      .toArray();

    const results = [];
    for (const transaction of transactions) {
      const category = await db.collection<CategoryDocument>('categories').findOne({ id: transaction.categoryId });
      const seller = await this.getUser(transaction.sellerId);
      const account = await db.collection<GmailAccountDocument>('gmailAccounts').findOne({ id: transaction.accountId });
      
      if (category && seller && account) {
        results.push({
          ...transaction,
          category,
          seller: { id: seller.id, email: seller.email },
          account
        });
      }
    }

    return results;
  }

  async getSellerTransactions(sellerId: string): Promise<(Transaction & { category: Category; buyer: Pick<User, 'id' | 'email'> })[]> {
    const transactions = await db.collection<TransactionDocument>('transactions')
      .find({ sellerId })
      .sort({ createdAt: -1 })
      .toArray();

    const results = [];
    for (const transaction of transactions) {
      const category = await db.collection<CategoryDocument>('categories').findOne({ id: transaction.categoryId });
      const buyer = await this.getUser(transaction.buyerId);
      
      if (category && buyer) {
        results.push({
          ...transaction,
          category,
          buyer: { id: buyer.id, email: buyer.email }
        });
      }
    }

    return results;
  }

  // Dispute operations
  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const disputeDoc: DisputeDocument = {
      id: uuidv4(),
      ...dispute,
      status: dispute.status || 'pending',
      isResolved: dispute.isResolved || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection<DisputeDocument>('disputes').insertOne(disputeDoc);
    return disputeDoc;
  }

  async getDisputesByTransaction(transactionId: string): Promise<Dispute[]> {
    const disputes = await db.collection<DisputeDocument>('disputes')
      .find({ transactionId })
      .toArray();
    return disputes;
  }

  async getAllDisputes(): Promise<(Dispute & { transaction: Transaction & { category: Category }; buyer: Pick<User, 'id' | 'email'>; seller: Pick<User, 'id' | 'email'> })[]> {
    const disputes = await db.collection<DisputeDocument>('disputes')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const results = [];
    for (const dispute of disputes) {
      const transaction = await db.collection<TransactionDocument>('transactions').findOne({ id: dispute.transactionId });
      if (!transaction) continue;

      const category = await db.collection<CategoryDocument>('categories').findOne({ id: transaction.categoryId });
      const buyer = await this.getUser(dispute.buyerId);
      const seller = await this.getUser(dispute.sellerId);
      
      if (category && buyer && seller) {
        results.push({
          ...dispute,
          transaction: {
            ...transaction,
            category
          },
          buyer: { id: buyer.id, email: buyer.email },
          seller: { id: seller.id, email: seller.email }
        });
      }
    }

    return results;
  }

  async getDisputesBySeller(sellerId: string): Promise<(Dispute & { transaction: Transaction; buyer: Pick<User, 'id' | 'email'> })[]> {
    const disputes = await db.collection<DisputeDocument>('disputes')
      .find({ sellerId })
      .sort({ createdAt: -1 })
      .toArray();

    const results = [];
    for (const dispute of disputes) {
      const transaction = await db.collection<TransactionDocument>('transactions').findOne({ id: dispute.transactionId });
      const buyer = await this.getUser(dispute.buyerId);
      
      if (transaction && buyer) {
        results.push({
          ...dispute,
          transaction,
          buyer: { id: buyer.id, email: buyer.email }
        });
      }
    }

    return results;
  }

  async updateDisputeStatus(id: string, status: string, sellerResponse?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (sellerResponse) {
      updateData.sellerResponse = sellerResponse;
    }
    if (status === 'resolved') {
      updateData.isResolved = true;
    }
    
    await db.collection<DisputeDocument>('disputes').updateOne(
      { id },
      { $set: updateData }
    );
  }

  async getPendingDisputesOlderThan(hours: number): Promise<Dispute[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const disputes = await db.collection<DisputeDocument>('disputes')
      .find({ 
        status: 'pending',
        createdAt: { $lt: cutoffTime }
      })
      .toArray();
    return disputes;
  }

  async processRefund(transactionId: string, reason: string): Promise<void> {
    const transaction = await db.collection<TransactionDocument>('transactions').findOne({ id: transactionId });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Add money back to buyer's account
    const refundAmount = parseFloat(transaction.amount);
    const currentUser = await this.getUser(transaction.buyerId);
    if (!currentUser) {
      throw new Error('Buyer not found');
    }
    
    const newBalance = (parseFloat(currentUser.balance) + refundAmount).toFixed(2);
    
    await db.collection<UserDocument>('users').updateOne(
      { id: transaction.buyerId },
      { 
        $set: { 
          balance: newBalance,
          updatedAt: new Date() 
        }
      }
    );

    // Update transaction status to refunded
    await db.collection<TransactionDocument>('transactions').updateOne(
      { id: transactionId },
      { 
        $set: { 
          status: 'refunded',
          isDisputed: false,
          updatedAt: new Date()
        }
      }
    );

    // Create refund notification for buyer
    try {
      await this.createNotification({
        userId: transaction.buyerId,
        type: 'refund',
        title: 'Refund Processed',
        message: `Your refund of $${refundAmount.toFixed(2)} has been processed and added to your account balance. Reason: ${reason}`,
        relatedId: transactionId
      });
    } catch (notificationError) {
      console.error("Error creating refund notification:", notificationError);
      // Don't fail the transaction for notification errors
    }
  }

  // Dashboard stats
  async getBuyerStats(buyerId: string): Promise<{
    totalPurchases: number;
    totalSpent: string;
    pendingVerification: number;
    successRate: number;
  }> {
    const stats = await db.collection<TransactionDocument>('transactions')
      .aggregate([
        { $match: { buyerId } },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: 1 },
            totalSpent: { $sum: { $toDouble: "$amount" } },
            pendingVerification: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
            },
            verifiedCount: {
              $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] }
            }
          }
        }
      ]).toArray();

    const data = stats[0] || { totalPurchases: 0, totalSpent: 0, pendingVerification: 0, verifiedCount: 0 };
    const successRate = data.totalPurchases > 0 ? (data.verifiedCount / data.totalPurchases) * 100 : 0;

    return {
      totalPurchases: data.totalPurchases,
      totalSpent: data.totalSpent.toString(),
      pendingVerification: data.pendingVerification,
      successRate: Math.round(successRate * 10) / 10,
    };
  }

  async getSellerStats(sellerId: string): Promise<{
    totalSales: string;
    activeListings: number;
    pendingOrders: number;
    successRate: number;
  }> {
    const transactionStats = await db.collection<TransactionDocument>('transactions')
      .aggregate([
        { $match: { sellerId } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: { $toDouble: "$amount" } },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
            },
            verifiedCount: {
              $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] }
            },
            totalCount: { $sum: 1 }
          }
        }
      ]).toArray();

    const activeListings = await db.collection<GmailAccountDocument>('gmailAccounts').countDocuments({
      sellerId,
      isAvailable: true
    });

    const data = transactionStats[0] || { totalSales: 0, pendingOrders: 0, verifiedCount: 0, totalCount: 0 };
    const successRate = data.totalCount > 0 ? (data.verifiedCount / data.totalCount) * 100 : 0;

    return {
      totalSales: data.totalSales.toString(),
      activeListings,
      pendingOrders: data.pendingOrders,
      successRate: Math.round(successRate * 10) / 10,
    };
  }

  // Admin statistics methods
  async getTotalUsers(): Promise<number> {
    return await db.collection<UserDocument>('users').countDocuments();
  }

  async getTotalTransactions(): Promise<number> {
    return await db.collection<TransactionDocument>('transactions').countDocuments();
  }

  async getTotalDisputes(): Promise<number> {
    return await db.collection<DisputeDocument>('disputes').countDocuments();
  }

  async getTotalRevenue(): Promise<number> {
    const revenueStats = await db.collection<TransactionDocument>('transactions')
      .aggregate([
        { $match: { status: 'verified' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: "$amount" } }
          }
        }
      ]).toArray();
    
    return revenueStats[0]?.totalRevenue || 0;
  }

  async getPendingVerifications(): Promise<number> {
    return await db.collection<TransactionDocument>('transactions').countDocuments({
      status: 'pending',
      isVerified: false
    });
  }

  async getRecentActivity(): Promise<Array<{
    type: 'user' | 'transaction' | 'dispute' | 'category';
    message: string;
    timestamp: Date;
  }>> {
    const activities: Array<{
      type: 'user' | 'transaction' | 'dispute' | 'category';
      message: string;
      timestamp: Date;
    }> = [];
    
    // Recent users (last 10)
    const recentUsers = await db.collection<UserDocument>('users')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    recentUsers.forEach(user => {
      activities.push({
        type: 'user' as const,
        message: `New user registered`,
        timestamp: user.createdAt
      });
    });
    
    // Recent transactions (last 10)
    const recentTransactions = await db.collection<TransactionDocument>('transactions')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    recentTransactions.forEach(transaction => {
      activities.push({
        type: 'transaction' as const,
        message: `Purchase completed for $${transaction.amount}`,
        timestamp: transaction.createdAt
      });
    });
    
    // Recent disputes (last 5)
    const recentDisputes = await db.collection<DisputeDocument>('disputes')
      .find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();
    
    recentDisputes.forEach(dispute => {
      activities.push({
        type: 'dispute' as const,
        message: `New dispute reported`,
        timestamp: dispute.createdAt
      });
    });
    
    // Sort all activities by timestamp and return latest 8
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);
  }

  // Deposit request operations
  async createDepositRequest(request: InsertDepositRequest): Promise<DepositRequest> {
    const depositRequest: DepositRequestDocument = {
      id: uuidv4(),
      userId: request.userId,
      amount: request.amount,
      status: request.status || 'pending',
      ...(request.paymentMethod && { paymentMethod: request.paymentMethod }),
      ...(request.transactionId && { transactionId: request.transactionId }),
      ...(request.userPhone && { userPhone: request.userPhone }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection<DepositRequestDocument>('depositRequests').insertOne(depositRequest);
    return depositRequest;
  }

  async getDepositRequestsByUser(userId: string): Promise<DepositRequest[]> {
    const requests = await db.collection<DepositRequestDocument>('depositRequests')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return requests;
  }

  async getAllDepositRequests(): Promise<(DepositRequest & { user: Pick<User, 'id' | 'email' | 'fullName'> })[]> {
    const requests = await db.collection<DepositRequestDocument>('depositRequests')
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            id: 1,
            userId: 1,
            amount: 1,
            status: 1,
            paymentMethod: 1,
            transactionId: 1,
            userPhone: 1,
            adminId: 1,
            adminNote: 1,
            createdAt: 1,
            updatedAt: 1,
            'user.id': 1,
            'user.email': 1,
            'user.firstName': 1,
            'user.lastName': 1
          }
        }
      ]).toArray();

    return requests as any;
  }

  async getPendingDepositRequests(): Promise<(DepositRequest & { user: Pick<User, 'id' | 'email' | 'fullName'> })[]> {
    const requests = await db.collection<DepositRequestDocument>('depositRequests')
      .aggregate([
        { $match: { status: 'pending' } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            id: 1,
            userId: 1,
            amount: 1,
            status: 1,
            paymentMethod: 1,
            transactionId: 1,
            userPhone: 1,
            adminId: 1,
            adminNote: 1,
            createdAt: 1,
            updatedAt: 1,
            'user.id': 1,
            'user.email': 1,
            'user.firstName': 1,
            'user.lastName': 1
          }
        }
      ]).toArray();

    return requests as any;
  }

  async updateDepositRequest(id: string, update: UpdateDepositRequest & { adminId: string }): Promise<DepositRequest | undefined> {
    const updateData: Partial<DepositRequestDocument> = {
      status: update.status,
      adminId: update.adminId,
      updatedAt: new Date(),
    };

    if (update.adminNote) {
      updateData.adminNote = update.adminNote;
    }

    const result = await db.collection<DepositRequestDocument>('depositRequests').findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    // If approved, add balance to user account
    if (update.status === 'approved' && result) {
      const depositRequest = result;
      await this.addBalance(depositRequest.userId, depositRequest.amount);
    }

    // Create notification for user about deposit status
    if (result) {
      try {
        const notificationType = update.status === 'approved' ? 'deposit_approved' : 'deposit_rejected';
        const title = update.status === 'approved' ? 'Deposit Request Approved' : 'Deposit Request Rejected';
        const message = update.status === 'approved' 
          ? `Your deposit request for $${result.amount} has been approved and added to your balance.`
          : `Your deposit request for $${result.amount} has been rejected. ${update.adminNote ? 'Reason: ' + update.adminNote : ''}`;

        await this.createNotification({
          userId: result.userId,
          type: notificationType,
          title: title,
          message: message,
          relatedId: result.id
        });
      } catch (notificationError) {
        console.error("Error creating deposit notification:", notificationError);
      }
    }

    return result || undefined;
  }

  async getDepositRequestById(id: string): Promise<DepositRequest | undefined> {
    const request = await db.collection<DepositRequestDocument>('depositRequests').findOne({ id });
    return request || undefined;
  }

  // Withdrawal request operations
  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const withdrawalRequest: WithdrawalRequestDocument = {
      id: uuidv4(),
      userId: request.userId,
      amount: request.amount,
      status: request.status || 'pending',
      paymentMethod: request.paymentMethod,
      accountNumber: request.accountNumber,
      accountName: request.accountName,
      ...(request.bankName && { bankName: request.bankName }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection<WithdrawalRequestDocument>('withdrawalRequests').insertOne(withdrawalRequest);
    return withdrawalRequest;
  }

  async getWithdrawalRequestsByUser(userId: string): Promise<WithdrawalRequest[]> {
    const requests = await db.collection<WithdrawalRequestDocument>('withdrawalRequests')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return requests;
  }

  async getAllWithdrawalRequests(): Promise<(WithdrawalRequest & { user: Pick<User, 'id' | 'email' | 'fullName'> })[]> {
    const requests = await db.collection<WithdrawalRequestDocument>('withdrawalRequests')
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            id: 1,
            userId: 1,
            amount: 1,
            status: 1,
            paymentMethod: 1,
            accountNumber: 1,
            accountName: 1,
            bankName: 1,
            adminId: 1,
            adminNote: 1,
            createdAt: 1,
            updatedAt: 1,
            'user.id': 1,
            'user.email': 1,
            'user.firstName': 1,
            'user.lastName': 1
          }
        }
      ]).toArray();

    return requests as any;
  }

  async updateWithdrawalRequest(id: string, update: UpdateWithdrawalRequest & { adminId: string }): Promise<WithdrawalRequest | undefined> {
    const updateData: Partial<WithdrawalRequestDocument> = {
      status: update.status,
      adminId: update.adminId,
      updatedAt: new Date(),
    };

    if (update.adminNote) {
      updateData.adminNote = update.adminNote;
    }

    const result = await db.collection<WithdrawalRequestDocument>('withdrawalRequests').findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    // If approved, deduct balance from user account
    if (update.status === 'approved' && result) {
      const withdrawalRequest = result;
      const withdrawalAmount = parseFloat(withdrawalRequest.amount);
      
      // Deduct amount from user balance
      const user = await this.getUser(withdrawalRequest.userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        const newBalance = (currentBalance - withdrawalAmount).toFixed(2);
        
        await db.collection<UserDocument>('users').updateOne(
          { id: withdrawalRequest.userId },
          { 
            $set: { 
              balance: newBalance,
              updatedAt: new Date() 
            }
          }
        );
      }
    }

    // Create notification for user about withdrawal status
    if (result) {
      try {
        const notificationType = update.status === 'approved' ? 'withdrawal_approved' : 'withdrawal_rejected';
        const title = update.status === 'approved' ? 'Withdrawal Request Approved' : 'Withdrawal Request Rejected';
        const message = update.status === 'approved' 
          ? `Your withdrawal request for $${result.amount} has been approved and processed.`
          : `Your withdrawal request for $${result.amount} has been rejected. ${update.adminNote ? 'Reason: ' + update.adminNote : ''}`;

        await this.createNotification({
          userId: result.userId,
          type: notificationType,
          title: title,
          message: message,
          relatedId: result.id
        });
      } catch (notificationError) {
        console.error("Error creating withdrawal notification:", notificationError);
      }
    }

    return result || undefined;
  }

  async getWithdrawalRequestById(id: string): Promise<WithdrawalRequest | undefined> {
    const request = await db.collection<WithdrawalRequestDocument>('withdrawalRequests').findOne({ id });
    return request || undefined;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const notificationDoc: NotificationDocument = {
      id: uuidv4(),
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId,
      isRead: false,
      createdAt: new Date(),
    };

    await db.collection<NotificationDocument>('notifications').insertOne(notificationDoc);
    return notificationDoc;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const notifications = await db.collection<NotificationDocument>('notifications')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return notifications;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.collection<NotificationDocument>('notifications').updateOne(
      { id },
      { $set: { isRead: true } }
    );
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.collection<NotificationDocument>('notifications').updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const count = await db.collection<NotificationDocument>('notifications')
      .countDocuments({ userId, isRead: false });
    
    return count;
  }
}

export const storage = new DatabaseStorage();