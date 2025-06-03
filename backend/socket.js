const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
        origin: '*', // Allow all origins for simplicity; adjust as needed
        methods: ['GET', 'POST'],
        },
    });
    
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
    }

const getSocket = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocket first.');
    }
    return io;
}

module.exports = { initSocket, getSocket };
