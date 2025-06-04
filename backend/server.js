const express = require('express');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');

const fileRouter = require('./routes/fileRoutes');
const userRouter = require('./routes/userRoutes');
const projectRouter = require('./routes/projectRoutes');
const aiRouter = require('./routes/aiRoutes');

const uploadRouter = require('./routes/uploadRoutes');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const app = express();

require('dotenv').config();

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = createServer(app);
// Set up Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity; adjust as needed
        methods: ['GET', 'POST'],
    },
});
// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    // Example event listener
    socket.on('message', (data) => {
        console.log('Message received:', data);
        // Broadcast the message to all connected clients
        io.emit('message', data);
    });
});

// Serve the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    }
    );
}

// Serve the upload routes
app.use('/api/upload', uploadRouter);


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/files', authMiddleware, fileRouter);
app.use('/api/users', userRouter);
app.use('/api/projects', authMiddleware, projectRouter);
app.use('/api/ai', authMiddleware, aiRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // Export the app for testing purposes

