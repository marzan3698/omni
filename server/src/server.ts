import app from './app.js';
import { createServer } from 'http';
import { initializeSocketIO } from './socket/socketServer.js';
import { restoreActiveWhatsAppClients } from './services/whatsapp.service.js';

const PORT = Number(process.env.PORT) || 5001;

// Fail fast if auth is not configured (prevents confusing 500 on login)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.error('❌ JWT_SECRET is not set. Add it to your .env file (e.g. JWT_SECRET=your-secret-key).');
  process.exit(1);
}

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocketIO(httpServer);

// Make io available globally for use in controllers/services
(global as any).io = io;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO server initialized`);
  // Restore WhatsApp clients for companies with active integration (so messages are received after restart)
  setImmediate(() => restoreActiveWhatsAppClients());
});

// Handle errors
httpServer.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
