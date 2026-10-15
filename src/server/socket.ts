import { Server } from "socket.io";
import { logger } from "../lib/logger";

export function setupSocket(io: Server) {
  io.on("connection", (socket) => {
    logger.info("Socket", "Client connected:", socket.id);

    socket.on("disconnect", () => {
      logger.info("Socket", "Client disconnected:", socket.id);
    });

    // Handle joining room for specific WA session
    socket.on("join-session", (sessionId: string) => {
        socket.join(sessionId);
        logger.debug("Socket", `Socket ${socket.id} joined session room: ${sessionId}`);
    });

    // Handle joining user-specific room for notifications
    socket.on("join-user-room", (userId: string) => {
        socket.join(`user:${userId}`);
        logger.debug("Socket", `Socket ${socket.id} joined user room: user:${userId}`);
    });

    // Handle joining store room for live order events
    socket.on("join-store", (storeId: string) => {
        if (!storeId) return;
        socket.join(`store:${storeId}`);
        logger.debug("Socket", `Socket ${socket.id} joined store room: store:${storeId}`);
    });

    socket.on("leave-store", (storeId: string) => {
        if (!storeId) return;
        socket.leave(`store:${storeId}`);
        logger.debug("Socket", `Socket ${socket.id} left store room: store:${storeId}`);
    });
  });
}
