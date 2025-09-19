import { z } from "zod";
import { ObjectId } from "mongodb";

// MongoDB Document Interfaces

// Session document for Replit Auth
export interface SessionDocument {
  _id?: ObjectId;
  sid: string;
  sess: any;
  expire: Date;
}

// User document
export interface UserDocument {
  _id?: ObjectId;
  id: string;
  phone: string; // Primary login identifier
  password: string; // Hashed password
  fullName: string;
  firstName?: string; // Added for proper name handling
  lastName?: string; // Added for proper name handling
  dateOfBirth: Date;
  email?: string;
  profileImageUrl?: string;
  balance: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category document
export interface CategoryDocument {
  _id?: ObjectId;
  id: string;
  name: string;
  slug: string;
  description: string;
  buyPrice: string;  // Price you pay to sellers when they sell accounts to the platform
  sellPrice: string; // Price buyers pay when purchasing accounts from the platform
  icon: string;
  iconColor: string;
  isActive: boolean;
  createdAt: Date;
}

// Gmail account document
export interface GmailAccountDocument {
  _id?: ObjectId;
  id: string;
  sellerId: string;
  categoryId: string;
  email: string;
  password: string;
  recoveryEmail?: string;
  isAvailable: boolean;
  isSold: boolean;
  createdAt: Date;
}

// Transaction document
export interface TransactionDocument {
  _id?: ObjectId;
  id: string;
  buyerId: string;
  sellerId: string;
  accountId: string;
  categoryId: string;
  amount: string;
  status: string; // pending, verified, disputed, refunded
  verificationDeadline?: Date;
  isVerified: boolean;
  isDisputed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Dispute document
export interface DisputeDocument {
  _id?: ObjectId;
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  issueType: string;
  description: string;
  status: string; // pending, accepted, rejected, resolved
  sellerResponse?: string;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Deposit request document
export interface DepositRequestDocument {
  _id?: ObjectId;
  id: string;
  userId: string;
  amount: string;
  status: string; // pending, approved, rejected
  paymentMethod?: string; // bkash, nagad
  transactionId?: string; // Transaction ID from bKash/Nagad
  userPhone?: string; // User's phone number
  adminId?: string;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Withdrawal request document
export interface WithdrawalRequestDocument {
  _id?: ObjectId;
  id: string;
  userId: string;
  amount: string;
  status: string; // pending, approved, rejected
  paymentMethod?: string; // bkash, nagad, bank
  accountNumber?: string; // Phone number for bKash/Nagad or bank account
  accountName?: string; // Account holder name
  bankName?: string; // For bank transfers
  adminId?: string;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification document
export interface NotificationDocument {
  _id?: ObjectId;
  id: string;
  userId: string; // Who receives the notification
  type: string; // purchase, dispute_created, dispute_accepted, dispute_rejected, refund, deposit_approved, withdrawal_approved, etc.
  title: string;
  message: string;
  relatedId?: string; // Transaction ID, Dispute ID, etc.
  isRead: boolean;
  createdAt: Date;
}

// Zod schemas for validation
export const insertCategorySchema = z.object({
  name: z.string().max(100),
  slug: z.string().max(100),
  description: z.string(),
  buyPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Buy price must be a valid positive number"
  }),
  sellPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Sell price must be a valid positive number"
  }),
  icon: z.string().max(50),
  iconColor: z.string().max(50),
  isActive: z.boolean().optional().default(true),
});

export const insertGmailAccountSchema = z.object({
  sellerId: z.string(),
  categoryId: z.string(),
  email: z.string().max(255),
  password: z.string().max(255),
  recoveryEmail: z.string().max(255).optional(),
});

export const insertTransactionSchema = z.object({
  buyerId: z.string(),
  sellerId: z.string(),
  accountId: z.string(),
  categoryId: z.string(),
  amount: z.string(),
  status: z.string().optional().default('pending'),
  verificationDeadline: z.date().optional(),
  isVerified: z.boolean().optional().default(false),
  isDisputed: z.boolean().optional().default(false),
});

export const insertDisputeSchema = z.object({
  transactionId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  issueType: z.string(),
  description: z.string(),
  status: z.string().optional().default('pending'),
  sellerResponse: z.string().optional(),
  isResolved: z.boolean().optional().default(false),
});

export const insertDepositRequestSchema = z.object({
  userId: z.string(),
  amount: z.string(),
  status: z.string().optional().default('pending'),
  paymentMethod: z.enum(['bkash', 'nagad']).optional(),
  transactionId: z.string().optional(),
  userPhone: z.string().optional(),
});

export const updateDepositRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().optional(),
});

// Auth schemas
export const signupSchema = z.object({
  phone: z.string().regex(/^[0-9]{11}$/, "Phone number must be 11 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required").max(100),
  dateOfBirth: z.string().refine((date) => {
    const parsed = new Date(date);
    const now = new Date();
    const age = now.getFullYear() - parsed.getFullYear();
    return !isNaN(parsed.getTime()) && age >= 13 && age <= 120;
  }, "Date of birth must be valid and age must be between 13-120"),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^[0-9]{11}$/, "Phone number must be 11 digits"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(), // Added for profile updates
  lastName: z.string().min(1).max(50).optional(), // Added for profile updates
  email: z.string().email().optional(),
  profileImageUrl: z.string().url().optional(),
});

export const insertWithdrawalRequestSchema = z.object({
  userId: z.string(),
  amount: z.string(),
  status: z.string().optional().default('pending'),
  paymentMethod: z.enum(['bkash', 'nagad', 'bank']),
  accountNumber: z.string(),
  accountName: z.string(),
  bankName: z.string().optional(),
});

// Schema for frontend withdrawal requests (without userId)
export const createWithdrawalRequestSchema = insertWithdrawalRequestSchema.omit({ userId: true });

export const updateWithdrawalRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().optional(),
});

export const insertNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum([
    'purchase', 
    'dispute_created', 
    'dispute_accepted', 
    'dispute_rejected', 
    'refund', 
    'deposit_approved', 
    'deposit_rejected',
    'withdrawal_approved',
    'withdrawal_rejected',
    'account_sold'
  ]),
  title: z.string(),
  message: z.string(),
  relatedId: z.string().optional(),
});

// Types
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpsertUser = Partial<UserDocument> & { id: string };
export type User = UserDocument;
export type Category = CategoryDocument;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type GmailAccount = GmailAccountDocument;
export type InsertGmailAccount = z.infer<typeof insertGmailAccountSchema>;
export type Transaction = TransactionDocument;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Dispute = DisputeDocument;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type DepositRequest = DepositRequestDocument;
export type InsertDepositRequest = z.infer<typeof insertDepositRequestSchema>;
export type UpdateDepositRequest = z.infer<typeof updateDepositRequestSchema>;
export type WithdrawalRequest = WithdrawalRequestDocument;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type UpdateWithdrawalRequest = z.infer<typeof updateWithdrawalRequestSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type Notification = NotificationDocument;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;