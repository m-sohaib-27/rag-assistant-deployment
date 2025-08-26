import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path";

// Recreate __dirname and __filename for ES modules in TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// 🔹 Increase timeout for all requests (AI ops)
app.use((req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(300000); // 5 min
  res.setTimeout(300000);
  next();
});

// 🔹 Longer timeout for /api/queries
app.use("/api/queries", (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(600000); // 10 min
  res.setTimeout(600000);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🔹 Logging middleware
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

// 🔹 Main async setup
(async () => {
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Dev vs Prod
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app); // must serve client/dist
  }

  const port = parseInt(process.env.PORT || "5000", 10);

  // ✅ FIX: bind to 0.0.0.0 so Railway can expose it
  server.listen(port, "0.0.0.0", () => {
    log(`✅ serving on port ${port}`);
  });
})();