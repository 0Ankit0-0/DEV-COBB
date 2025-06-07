const express = require('express');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const fileRouter = require('./routes/fileRoutes');
const userRouter = require('./routes/userRoutes');
const projectRouter = require('./routes/projectRoutes');
const aiRouter = require('./routes/aiRoutes');
const uploadRouter = require('./routes/uploadRoutes');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const { createServer } = require('http');
const server = createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/upload', uploadRouter);
app.use('/api/files', fileRouter);
app.use('/api/users', userRouter);
app.use('/api/projects', projectRouter);
app.use('/api/ai', aiRouter);

// Production: serve React app
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
}

// Error handler
app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'An error occurred!' });
});

// Initialize Socket.IO for collaboration
initSocket(server);

// Start the server (use `server` for socket support)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // For testing