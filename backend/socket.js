const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Project = require("./models/Project");
const File = require("./models/File");
const FileContent = require("./models/FileContent");
const judge0Service = require("./services/judge0Service");
const { protect } = require("./middleware/auth.middleware");

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "devcobb-secret-key"
      );

      // Get user from the token
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user to socket
      socket.user = {
        id: user._id,
        name: user.name,
        email: user.email,
      };

      next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    // Join project room
    socket.on("join:project", async ({ projectId }) => {
      try {
        // Check if user has access to project
        const project = await Project.findById(projectId);

        if (!project) {
          socket.emit("error", { message: "Project not found" });
          return;
        }

        const isOwner = project.owner.toString() === socket.user.id;
        const isCollaborator = project.collaborators.some(
          (collab) => collab.user.toString() === socket.user.id
        );

        if (!isOwner && !isCollaborator) {
          socket.emit("error", {
            message: "Not authorized to access this project",
          });
          return;
        }

        // Join room
        socket.join(`project:${projectId}`);

        // Generate random color for user cursor
        const colors = [
          "#FF5733",
          "#33FF57",
          "#3357FF",
          "#FF33A8",
          "#33A8FF",
          "#A833FF",
          "#FF8333",
          "#33FFC1",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // Add user to collaborators list
        const collaborator = {
          id: socket.user.id,
          name: socket.user.name,
          socketId: socket.id,
          color: randomColor,
        };

        // Broadcast to room that user joined
        socket.to(`project:${projectId}`).emit("user:joined", collaborator);

        // Get all connected users in the room
        const room = io.sockets.adapter.rooms.get(`project:${projectId}`);
        const connectedSockets = room ? Array.from(room) : [];

        // Get collaborators info
        const collaborators = [];

        for (const socketId of connectedSockets) {
          if (socketId === socket.id) continue;

          const clientSocket = io.sockets.sockets.get(socketId);
          if (clientSocket && clientSocket.user) {
            collaborators.push({
              id: clientSocket.user.id,
              name: clientSocket.user.name,
              socketId: socketId,
              color: clientSocket.color || randomColor,
            });
          }
        }

        // Send collaborators list to the user
        socket.emit("collaborators", collaborators);

        // Store user color
        socket.color = randomColor;

        console.log(`User ${socket.user.name} joined project ${projectId}`);
      } catch (err) {
        console.error("Error joining project:", err);
        socket.emit("error", { message: "Error joining project" });
      }
    });

    // Leave project room
    socket.on("leave:project", ({ projectId }) => {
      socket.leave(`project:${projectId}`);
      socket
        .to(`project:${projectId}`)
        .emit("user:left", { id: socket.user.id });
      console.log(`User ${socket.user.name} left project ${projectId}`);
    });

    // File update
    socket.on("file:update", ({ projectId, fileId, content }) => {
      socket.to(`project:${projectId}`).emit("file:update", {
        fileId,
        content,
        userId: socket.user.id,
      });
    });

    // Cursor position update
    socket.on("cursor:update", ({ projectId, fileId, position }) => {
      socket.to(`project:${projectId}`).emit("cursor:update", {
        userId: socket.user.id,
        userName: socket.user.name,
        fileId,
        position,
        color: socket.color,
      });
    });

    // File operations
    socket.on("file:create", ({ projectId, file }) => {
      socket.to(`project:${projectId}`).emit("file:create", file);
    });

    socket.on("file:delete", ({ projectId, fileId }) => {
      socket.to(`project:${projectId}`).emit("file:delete", fileId);
    });

    socket.on("file:rename", ({ projectId, fileId, newName }) => {
      socket
        .to(`project:${projectId}`)
        .emit("file:rename", { fileId, newName });
    });

    socket.on("file:move", ({ projectId, fileId, newParentId }) => {
      socket
        .to(`project:${projectId}`)
        .emit("file:move", { fileId, newParentId });
    });

    // Code execution using Judge0
    socket.on(
      "execution:run",
      async ({ projectId, fileId, language, stdin = "" }) => {
        try {
          socket.emit("execution:output", {
            output: `Running ${language} code...`,
          });

          // Get file content from database
          let sourceCode = "";

          if (fileId) {
            const fileContent = await FileContent.findOne({ file: fileId });

            if (!fileContent) {
              socket.emit("execution:error", {
                error: "File content not found",
              });
              return;
            }

            sourceCode = fileContent.content;
          } else {
            // Use provided code directly
            sourceCode = language;
            language = fileId; // In this case, fileId is actually the language
          }

          // Submit code to Judge0
          const submission = await judge0Service.submitCode(
            sourceCode,
            language,
            stdin
          );

          socket.emit("execution:output", {
            output: `Code submitted for execution. Waiting for results...`,
          });

          // If using the real Judge0 API
          if (process.env.JUDGE0_API_KEY) {
            // Poll for results
            let result;
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
              attempts++;

              // Wait a bit before checking
              await new Promise((resolve) => setTimeout(resolve, 1000));

              result = await judge0Service.getSubmissionResult(
                submission.token
              );

              // If processing is complete
              if (result.status.id >= 3) {
                break;
              }

              socket.emit("execution:output", {
                output: `Status: ${result.status.description}...`,
              });
            }

            if (result.stdout) {
              socket.emit("execution:output", { output: result.stdout });
            }

            if (result.stderr) {
              socket.emit("execution:error", { error: result.stderr });
            }

            if (result.compile_output && result.status.id !== 3) {
              socket.emit("execution:error", { error: result.compile_output });
            }

            socket.emit("execution:done", {
              status: result.status.description,
              time: result.time,
              memory: result.memory,
            });
          } else {
            // Use simulated results
            await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing delay

            const simulatedResult = judge0Service.getSimulatedResult(
              submission.token,
              sourceCode
            );

            if (simulatedResult.stdout) {
              socket.emit("execution:output", {
                output: simulatedResult.stdout,
              });
            }

            socket.emit("execution:done", {
              status: simulatedResult.status.description,
              time: simulatedResult.time,
              memory: simulatedResult.memory,
            });
          }
        } catch (err) {
          console.error("Execution error:", err);
          socket.emit("execution:error", {
            error: `Error executing code: ${err.message}`,
          });
        }
      }
    );

    // Manual code execution from terminal
    socket.on("terminal:execute", async ({ projectId, language, code }) => {
      try {
        socket.emit("terminal:output", {
          output: `Running ${language} code...`,
        });

        // Submit code to Judge0
        const submission = await judge0Service.submitCode(code, language);

        socket.emit("terminal:output", {
          output: `Code submitted for execution. Waiting for results...`,
        });

        // If using the real Judge0 API
        if (process.env.JUDGE0_API_KEY) {
          // Poll for results
          let result;
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            attempts++;

            // Wait a bit before checking
            await new Promise((resolve) => setTimeout(resolve, 1000));

            result = await judge0Service.getSubmissionResult(submission.token);

            // If processing is complete
            if (result.status.id >= 3) {
              break;
            }

            socket.emit("terminal:output", {
              output: `Status: ${result.status.description}...`,
            });
          }

          if (result.stdout) {
            socket.emit("terminal:output", { output: result.stdout });
          }

          if (result.stderr) {
            socket.emit("terminal:error", { error: result.stderr });
          }

          if (result.compile_output && result.status.id !== 3) {
            socket.emit("terminal:error", { error: result.compile_output });
          }

          socket.emit("terminal:done", {
            status: result.status.description,
            time: result.time,
            memory: result.memory,
          });
        } else {
          // Use simulated results
          await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing delay

          const simulatedResult = judge0Service.getSimulatedResult(
            submission.token,
            code
          );

          if (simulatedResult.stdout) {
            socket.emit("terminal:output", { output: simulatedResult.stdout });
          }

          socket.emit("terminal:done", {
            status: simulatedResult.status.description,
            time: simulatedResult.time,
            memory: simulatedResult.memory,
          });
        }
      } catch (err) {
        console.error("Terminal execution error:", err);
        socket.emit("terminal:error", {
          error: `Error executing code: ${err.message}`,
        });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      // Notify all rooms that the user left
      const rooms = Array.from(socket.rooms);

      rooms.forEach((room) => {
        if (room.startsWith("project:")) {
          const projectId = room.split(":")[1];
          socket.to(room).emit("user:left", { id: socket.user.id });
          console.log(
            `User ${socket.user.name} disconnected from project ${projectId}`
          );
        }
      });

      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
};

module.exports = initializeSocket;
