"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const socketInstance = io(
      process.env.REACT_APP_API_URL || "http://localhost:5001",
      {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      }
    );

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);
      setReconnectAttempts(0);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setReconnectAttempts((prev) => prev + 1);
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socketInstance.on("collaborators", (data) => {
      setCollaborators(data);
    });

    socketInstance.on("user:joined", (user) => {
      setCollaborators((prev) => {
        if (prev.some((u) => u.id === user.id)) {
          return prev;
        }
        return [...prev, user];
      });
    });

    socketInstance.on("user:left", (data) => {
      setCollaborators((prev) => prev.filter((user) => user.id !== data.id));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  // Handle reconnection attempts
  useEffect(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      // You could show a notification to the user here
    }
  }, [reconnectAttempts]);

  // Provide a way to manually reconnect
  const reconnect = useCallback(() => {
    if (socket) {
      socket.connect();
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{ socket, connected, collaborators, reconnect }}
    >
      {children}
    </SocketContext.Provider>
  );
};
