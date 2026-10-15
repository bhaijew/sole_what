"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextValue = {
    getSocket: () => Socket | null;
    joinSession: (sessionId: string) => void;
    joinStore: (storeId: string) => void;
    leaveStore: (storeId: string) => void;
};

const SocketContext = createContext<SocketContextValue>({
    getSocket: () => null,
    joinSession: () => {},
    joinStore: () => {},
    leaveStore: () => {},
});

export function useSocket() {
    return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const socket = io({
            path: "/api/socket/io",
            addTrailingSlash: false,
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
            setReady(true);
        });

        socket.on("disconnect", () => {
            setReady(false);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const getSocket = () => socketRef.current;

    const joinSession = (sessionId: string) => {
        const s = socketRef.current;
        if (s?.connected) {
            s.emit("join-session", sessionId);
        }
    };

    const joinStore = (storeId: string) => {
        const s = socketRef.current;
        if (s?.connected && storeId) {
            s.emit("join-store", storeId);
        }
    };

    const leaveStore = (storeId: string) => {
        const s = socketRef.current;
        if (s?.connected && storeId) {
            s.emit("leave-store", storeId);
        }
    };

    return (
        <SocketContext.Provider value={{ getSocket, joinSession, joinStore, leaveStore }}>
            {children}
        </SocketContext.Provider>
    );
}
