const { protect } = require("./middleware/auth.middleware");
const Project = require("./models/Project");
const User = require("./models/User");
const jwt = require("jsonwebtoken");

// Add structured logging
const logger = {
  info: (message) => console.log(`[Socket] ${message}`),
  error: (message, error) => console.error(`[Socket ERROR] ${message}`, error),
};

// Define these at module level to prevent undefined errors
const fileUpdateDebounceTimers = {};
const cursorThrottleTimers = {};

module.exports = (io) => {
  // Enhanced auth middleware with better error handling
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        logger.error("No authentication token provided");
        return next(new Error("Authentication token required"));
      }

      const secret = process.env.JWT_SECRET || "devcobb-secret-key";

      try {
        const decoded = jwt.verify(token, secret);

        const user = await User.findById(decoded.id).select("-password").exec();

        if (!user) {
          logger.error(`User not found: ${decoded.id}`);
          return next(new Error("User not found"));
        }

        socket.user = {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        };

        logger.info(
          `Socket authenticated for user: ${user.name} (${user._id})`
        );
        next();
      } catch (jwtError) {
        logger.error("JWT verification failed:", jwtError);
        return next(new Error("Invalid authentication token"));
      }
    } catch (err) {
      logger.error("Socket authentication error:", err);
      return next(new Error("Authentication error"));
    }
  });

  // Track active rooms for cleanup
  const activeRooms = new Map();

  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.user.name} (${socket.id})`);

    // Add connection timeout and heartbeat checking
    socket.heartbeat = true;

    // Handle heartbeat to keep connection alive
    socket.on("heartbeat", () => {
      socket.heartbeat = true;
      socket.emit("heartbeat-ack");
    });

    // Add reconnection handling
    socket.on("reconnect", () => {
      logger.info(`User reconnected: ${socket.user.name} (${socket.id})`);
    });

    // Project joining event
    socket.on("project:join", async ({ projectId }) => {
      try {
        // Validate projectId
        if (!projectId) {
          return socket.emit("error", { message: "Project ID required" });
        }

        const project = await Project.findById(projectId);
        if (!project) {
          return socket.emit("error", { message: "Project not found" });
        }

        // Check if user has access to the project
        const userHasAccess =
          project.owner.toString() === socket.user.id ||
          project.collaborators.some((id) => id.toString() === socket.user.id);

        if (!userHasAccess) {
          return socket.emit("error", {
            message: "Unauthorized access to project",
          });
        }

        // Join the room for this project
        const roomId = `project:${projectId}`;
        socket.join(roomId);

        // Track this socket in the room
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, new Set());
        }
        activeRooms.get(roomId).add(socket.id);

        // Get current users in the room
        const clients = await io.in(roomId).fetchSockets();
        const users = clients.map((client) => ({
          id: client.user.id,
          name: client.user.name,
          socketId: client.id,
          avatar: client.user.avatar,
        }));

        // Notify everyone about the new user
        socket.to(roomId).emit("user:joined", {
          id: socket.user.id,
          name: socket.user.name,
          socketId: socket.id,
          avatar: socket.user.avatar,
        });

        // Send the list of connected users to the newly joined user
        socket.emit("collaborators", users);

        // Broadcast to all others in the room
        socket.to(roomId).emit("collaborators", users);

        logger.info(`User ${socket.user.name} joined project ${projectId}`);
      } catch (err) {
        logger.error("Error in project:join", err);
        socket.emit("error", {
          message: "Failed to join project",
          details: err.message,
        });
      }
    });

    // File update event
    socket.on("file:update", ({ projectId, fileId, content, userId }) => {
      if (!projectId || !fileId) {
        return socket.emit("error", { message: "Missing required parameters" });
      }

      const roomId = `project:${projectId}`;
      const updateKey = `${socket.id}:${fileId}`;

      // Debounce rapid updates from the same client to the same file
      if (fileUpdateDebounceTimers[updateKey]) {
        clearTimeout(fileUpdateDebounceTimers[updateKey]);
      }

      fileUpdateDebounceTimers[updateKey] = setTimeout(() => {
        // Forward the update to all other clients in the room
        socket.to(roomId).emit("file:updated", {
          fileId,
          content,
          userId: socket.user.id,
          timestamp: Date.now(),
        });

        delete fileUpdateDebounceTimers[updateKey];
      }, 100); // Debounce time in ms
    });

    // Cursor position update
    socket.on("cursor:update", ({ projectId, fileId, position }) => {
      if (!projectId || !fileId) return;

      const roomId = `project:${projectId}`;
      const cursorKey = `${socket.id}:${fileId}`;

      // Throttle cursor updates
      if (cursorThrottleTimers[cursorKey]) return;

      cursorThrottleTimers[cursorKey] = setTimeout(() => {
        socket.to(roomId).emit("cursor:updated", {
          userId: socket.user.id,
          userName: socket.user.name,
          fileId,
          position,
          timestamp: Date.now(),
        });

        delete cursorThrottleTimers[cursorKey];
      }, 50); // Throttle time in ms
    });

    // Code execution request
    socket.on("execution:run", ({ projectId, fileId, language }) => {
      if (!projectId || !fileId) {
        return socket.emit("error", { message: "Missing required parameters" });
      }

      simulateCodeExecution(socket, projectId, language);
    });

    // Handle disconnect with proper cleanup
    socket.on("disconnect", (reason) => {
      logger.info(
        `User disconnected: ${socket.user?.name} (${socket.id}), reason: ${reason}`
      );

      // Clean up all rooms this socket was in
      for (const [roomId, socketIds] of activeRooms.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);

          // If room format is project:ID, notify others in room
          if (roomId.startsWith("project:")) {
            const projectId = roomId.split(":")[1];
            socket.to(roomId).emit("user:left", {
              id: socket.user.id,
              name: socket.user.name,
              reason,
              timestamp: Date.now(),
            });

            // Update collaborators list for others
            io.in(roomId)
              .fetchSockets()
              .then((clients) => {
                const remainingUsers = clients.map((client) => ({
                  id: client.user.id,
                  name: client.user.name,
                  socketId: client.id,
                  avatar: client.user.avatar,
                }));

                io.to(roomId).emit("collaborators", remainingUsers);
              })
              .catch((err) => {
                logger.error(
                  "Error updating collaborators after disconnect",
                  err
                );
              });

            logger.info(
              `User ${socket.user?.name} disconnected from project ${projectId}`
            );
          }

          // Remove empty room from tracking
          if (socketIds.size === 0) {
            activeRooms.delete(roomId);
          }
        }
      }

      // Clear any timers associated with this socket
      for (const key in fileUpdateDebounceTimers) {
        if (key.includes(socket.id)) {
          clearTimeout(fileUpdateDebounceTimers[key]);
          delete fileUpdateDebounceTimers[key];
        }
      }

      for (const key in cursorThrottleTimers) {
        if (key.includes(socket.id)) {
          clearTimeout(cursorThrottleTimers[key]);
          delete cursorThrottleTimers[key];
        }
      }
    });
  });

  const heartbeatInterval = setInterval(() => {
    io.sockets.sockets.forEach((socket) => {
      if (!socket.heartbeat) {
        logger.info(`Terminating stale socket connection: ${socket.id}`);
        return socket.disconnect(true);
      }
      socket.heartbeat = false;
      socket.emit("heartbeat");
    });
  }, 30000);

  // Clean up on server shutdown
  process.on("SIGTERM", () => {
    clearInterval(heartbeatInterval);
  });
};

function simulateCodeExecution(socket, projectId, language) {
  socket.emit("execution:output", { output: `Running ${language} code...` });

  setTimeout(() => {
    switch (language) {
      case "javascript":
        socket.emit("execution:output", {
          output: 'console.log("Hello, world!");',
        });
        setTimeout(() => {
          socket.emit("execution:output", { output: "Hello, world!" });
          socket.emit("execution:done");
        }, 500);
        break;

      case "python":
        socket.emit("execution:output", { output: 'print("Hello, world!")' });
        setTimeout(() => {
          socket.emit("execution:output", { output: "Hello, world!" });
          socket.emit("execution:done");
        }, 500);
        break;

      case "html":
        socket.emit("execution:output", {
          output: "Rendering HTML in preview panel...",
        });
        socket.emit("execution:done");
        break;

      default:
        socket.emit("execution:output", {
          output: `Language ${language} execution simulated.`,
        });
        socket.emit("execution:output", { output: "Hello, world!" });
        socket.emit("execution:done");
    }
  }, 1000);
}
