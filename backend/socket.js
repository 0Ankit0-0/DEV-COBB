const { Server } = require('socket.io');

/**
 * Socket.IO collaboration events:
 * - joinRoom: { roomId, userId }
 * - leaveRoom: { roomId, userId }
 * - codeChange: { roomId, fileId, code, userId }
 * - cursorMove: { roomId, userId, cursor }
 * - chatMessage: { roomId, userId, message }
 */

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Adjust as needed
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        // Join a collaboration room
        socket.on('joinRoom', ({ roomId, userId }) => {
            socket.join(roomId);
            socket.to(roomId).emit('userJoined', { userId });
        });

        // Leave a collaboration room
        socket.on('leaveRoom', ({ roomId, userId }) => {
            socket.leave(roomId);
            socket.to(roomId).emit('userLeft', { userId });
        });

        // Real-time code change event
        socket.on('codeChange', ({ roomId, fileId, code, userId }) => {
            // Broadcast to other clients in the room (except sender)
            socket.to(roomId).emit('codeChange', { fileId, code, userId });
        });

        // Real-time cursor move event
        socket.on('cursorMove', ({ roomId, userId, cursor }) => {
            socket.to(roomId).emit('cursorMove', { userId, cursor });
        });

        // Real-time chat in room
        socket.on('chatMessage', ({ roomId, userId, message }) => {
            socket.to(roomId).emit('chatMessage', { userId, message });
        });

        // Optionally: handle disconnects
        socket.on('disconnect', () => {
            // Optionally, notify rooms or log
        });
    });
};

const getSocket = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocket first.');
    }
    return io;
};

module.exports = { initSocket, getSocket };