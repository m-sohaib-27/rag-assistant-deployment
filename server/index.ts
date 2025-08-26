import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { resolve } from "path";
import process from "process";

const app = express();

// Long request timeouts (AI ops)
app.use((req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  next();
});

app.use("/api/queries", (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(600000);
  res.setTimeout(600000);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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
      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Bootstrap
(async () => {
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    log(`❌ Error: ${message}`);
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // This is the key fix: use process.cwd() to get the path reliably.
    const productionPath = resolve(process.cwd(), "client");
    app.use(express.static(productionPath));
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);

  // ✅ Railway works best with 0.0.0.0
  server.listen(port, "0.0.0.0", () => {
    log(`✅ Server running on http://0.0.0.0:${port}`);
  });
})();
