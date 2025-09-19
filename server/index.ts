import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Auto-verification function for transactions older than 24 hours
  async function autoVerifyTransactions() {
    try {
      log("Running auto-verification check for transactions older than 24 hours...");

      const oldTransactions = await storage.getPendingTransactionsOlderThan(24);

      if (oldTransactions.length > 0) {
        log(`Found ${oldTransactions.length} transactions to auto-verify`);

        for (const transaction of oldTransactions) {
          // Get category to get the buyPrice for seller payment
          const category = await storage.getCategoryById(transaction.categoryId);
          if (category) {
            // Update transaction as verified
            await storage.updateTransactionStatus(transaction.id, 'verified', true);
            // Pay seller with buyPrice
            await storage.updateUserBalance(transaction.sellerId, category.buyPrice);
            log(`Auto-verified transaction: ${transaction.id} and paid seller $${category.buyPrice}`);
          } else {
            log(`Category not found for transaction: ${transaction.id}`);
          }
        }

        log(`Auto-verified ${oldTransactions.length} transactions`);
      } else {
        log("No transactions found for auto-verification");
      }
    } catch (error) {
      log(`Error in auto-verification: ${error}`);
    }
  }

  // Auto-accept function for disputes older than 3 hours
  async function autoAcceptDisputes() {
    try {
      log("Running auto-accept check for disputes older than 3 hours...");

      const oldDisputes = await storage.getPendingDisputesOlderThan(3);

      if (oldDisputes.length > 0) {
        log(`Found ${oldDisputes.length} disputes to auto-accept`);

        for (const dispute of oldDisputes) {
          // Process refund
          await storage.processRefund(dispute.transactionId, 'Auto-accepted - seller did not respond within 3 hours');
          // Update dispute status
          await storage.updateDisputeStatus(dispute.id, 'accepted', 'Auto-accepted due to no seller response within 3 hours');
          log(`Auto-accepted dispute: ${dispute.id}`);
        }

        log(`Auto-accepted ${oldDisputes.length} disputes`);
      } else {
        log("No disputes found for auto-accept");
      }
    } catch (error) {
      log(`Error in auto-accept: ${error}`);
    }
  }

  // Combined function to run both auto-verification and auto-accept
  async function runAutomatedChecks() {
    await autoVerifyTransactions();
    await autoAcceptDisputes();
  }

  // Run automated checks every hour (3600000 ms)
  setInterval(runAutomatedChecks, 3600000);

  // Run automated checks once on startup (after 30 seconds)
  setTimeout(runAutomatedChecks, 30000);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();