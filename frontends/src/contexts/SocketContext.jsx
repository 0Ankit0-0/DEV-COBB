import { createContext, useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

// Helper function to debug socket connection events
const debugSocketConnection = (socket) => {
  const events = [
    'connect', 'connect_error', 'disconnect', 'error', 
    'reconnect', 'reconnect_attempt', 'reconnect_failed'
  ];
  
  events.forEach(event => {
    socket.on(event, (...args) => {
      console.log(`Socket event [${event}]:`, args);
    });
  });
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const { projectId } = useParams()
  const { currentUser } = useAuth()

  useEffect(() => {
    if (!currentUser || !projectId) return

    // Close any existing connection first
    if (socket) {
      console.log("Closing existing socket connection");
      socket.disconnect();
    }

    const token = localStorage.getItem("token")
    const socketUrl = process.env.REACT_APP_API_URL || "http://localhost:5001";
    
    console.log("Initializing new socket connection");
    const newSocket = io(socketUrl, {
      path: "/socket.io",  // Explicitly set the path
      auth: { token },
      query: { projectId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,  // Increase connection timeout
      transports: ['websocket', 'polling'],  // Try both transports
      forceNew: true,
      extraHeaders: {
        "User-Agent": navigator.userAgent
      }
    })

    // Add debug logging for all socket events
    debugSocketConnection(newSocket);

    newSocket.on("connect", () => {
      console.log(`Socket connected successfully. ID: ${newSocket.id}`);
      setConnected(true);
      
      // Join the project room after successful connection
      newSocket.emit("project:join", { projectId });
    })

    newSocket.on("disconnect", (reason) => {
      console.log(`Socket disconnected. Reason: ${reason}`);
      setConnected(false);
    })

    newSocket.on("collaborators", (users) => {
      console.log("Received collaborators update:", users);
      setCollaborators(users);
    })

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message || err);
      console.error("Connection details:", {
        url: socketUrl,
        projectId,
        hasToken: !!token
      });
      setConnected(false);
    })

    // Add error handling for socket errors
    newSocket.on("error", (err) => {
      console.error("Socket error:", err);
    })

    setSocket(newSocket)

    return () => {
      console.log("Cleaning up socket connection");
      if (newSocket) {
        newSocket.disconnect();
      }
    }
  }, [currentUser, projectId]) // Removed socket from dependency array to fix infinite loop

  const value = {
    socket,
    connected,
    collaborators,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}