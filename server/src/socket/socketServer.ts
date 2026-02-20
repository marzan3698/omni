import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { socketAuth } from './socketAuth.js';
import { setupTaskConversationHandlers } from './taskConversationHandlers.js';
import { setupWhatsAppHandlers } from './whatsappHandlers.js';

/**
 * Initialize Socket.IO server
 */
export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // In production on cPanel, Passenger proxies /api/* to Node.js.
  // Socket.IO requests arrive as /api/socket.io, so the path must match.
  // We use /api/socket.io uniformly so it works identically on localhost and production.
  const socketPath = process.env.SOCKET_IO_PATH || '/api/socket.io';

  const io = new SocketIOServer(httpServer, {
    path: socketPath,
    cors: {
      origin: [
        clientUrl,
        'https://imoics.com',
        'https://www.imoics.com',
        'https://paaera.com',
        'https://www.paaera.com',
        'http://localhost:5173',
        'http://localhost:5174',
      ],
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
    setupWhatsAppHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
};

// Export Socket.IO instance type for use in other modules
export type { SocketIOServer };

