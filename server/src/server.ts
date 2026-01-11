import app from './app.js';
import { createServer } from 'http';
import { initializeSocketIO } from './socket/socketServer.js';

const PORT = process.env.PORT || 5001;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocketIO(httpServer);

// Make io available globally for use in controllers/services
(global as any).io = io;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO server initialized`);
});

