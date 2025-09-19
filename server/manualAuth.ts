import bcrypt from 'bcryptjs';
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectMongo from "connect-mongo";
import { storage } from "./storage";
import { signupSchema, loginSchema, type SignupData, type LoginData } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const mongoStore = connectMongo.create({
    mongoUrl: process.env.MONGODB_URI!,
    dbName: "gmailmarket",
    collectionName: "sessions",
    ttl: Math.floor(sessionTtl / 1000), // TTL in seconds
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: mongoStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const signupData: SignupData = signupSchema.parse(req.body);
      
      // Check if phone number already exists
      const existingUser = await storage.getUserByPhone(signupData.phone);
      if (existingUser) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(signupData.password, 12);

      // Create user
      const newUser = await storage.createUser({
        id: uuidv4(),
        phone: signupData.phone,
        password: hashedPassword,
        fullName: signupData.fullName,
        firstName: signupData.fullName.split(' ')[0] || '',
        lastName: signupData.fullName.split(' ').slice(1).join(' ') || '',
        dateOfBirth: new Date(signupData.dateOfBirth),
        balance: "0",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create session
      (req.session as any).userId = newUser.id;

      res.json({ 
        message: "Account created successfully",
        user: {
          id: newUser.id,
          phone: newUser.phone,
          fullName: newUser.fullName,
          balance: newUser.balance
        }
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const loginData: LoginData = loginSchema.parse(req.body);
      
      // Find user by phone
      const user = await storage.getUserByPhone(loginData.phone);
      if (!user) {
        return res.status(400).json({ message: "Invalid phone number or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid phone number or password" });
      }

      // Create session
      (req.session as any).userId = user.id;

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          balance: user.balance
        }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};