import { loadEnvConfig } from "@next/env";
// Load environment variables before any other imports/logic
loadEnvConfig(process.cwd());

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { setupSocket } from "./socket";
import { waManager } from "../modules/whatsapp/manager";
import { logger } from "../lib/logger";
import pkg from "../../package.json";

// Ensure production base URL is properly set for NextAuth and redirects
const defaultPublicUrl = process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "https://solewhat-production.up.railway.app");

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = defaultPublicUrl;
}
if (!process.env.AUTH_URL) {
  process.env.AUTH_URL = defaultPublicUrl;
}

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3030", 10);

if (!process.env.AUTH_SECRET) {
  logger.error("Server", "AUTH_SECRET is not set. Generate one with: openssl rand -base64 32");
  process.exit(1);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      if (!req.url) return;

      // Reverse proxy / Railway header normalization:
      // Ensure host header reflects public domain instead of internal 0.0.0.0 or container port
      const forwardedHost = req.headers["x-forwarded-host"] as string | undefined;
      const host = req.headers.host;

      if (forwardedHost && !forwardedHost.includes("0.0.0.0")) {
        req.headers.host = forwardedHost;
      } else if (!host || host.includes("0.0.0.0") || (host.includes("localhost") && !dev)) {
        req.headers.host = process.env.RAILWAY_PUBLIC_DOMAIN || "solewhat-production.up.railway.app";
      }

      if (!req.headers["x-forwarded-proto"]) {
        req.headers["x-forwarded-proto"] = dev ? "http" : "https";
      }

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      logger.error("Server", "Error handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  setupSocket(io);
  // Optional: Global instance for Baileys to emit events
  (global as any).io = io;

  // Initialize WhatsApp Manager
  waManager.setup(io);
  waManager.loadSessions();

  // Start Scheduler
  import("../modules/whatsapp/scheduler").then(m => m.startScheduler());

  // Reverse proxy / Railway / Cloudflare fix:
  // Node.js documentation mandates: headersTimeout MUST be strictly greater than keepAliveTimeout.
  // When equal, Node abruptly resets idle TCP sockets, triggering ERR_CONNECTION_RESET on chunk requests.
  server.keepAliveTimeout = 65 * 1000; // 65 seconds
  server.headersTimeout = 70 * 1000;   // 70 seconds (> keepAliveTimeout)

  server.listen(port, () => {
    logger.banner(pkg.name.toUpperCase(), pkg.version, port);

    // 100% Self-Hosted & Independent Node Server
    logger.info("Server", `Server running at http://${hostname}:${port}`);
    // --------------------------------
  });
});
