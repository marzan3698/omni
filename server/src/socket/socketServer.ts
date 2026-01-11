import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { socketAuth } from './socketAuth.js';
import { setupTaskConversationHandlers } from './taskConversationHandlers.js';

/**
 * Initialize Socket.IO server
 */
export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Apply authentication middleware
  io.use(socketAuth);

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${(socket as any).userId})`);

    // Setup task conversation handlers
    setupTaskConversationHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
};

// Export Socket.IO instance type for use in other modules
export type { SocketIOServer };

