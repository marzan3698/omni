import { Server as SocketIOServer, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  companyId?: number;
}

/**
 * Setup WhatsApp Socket.IO handlers. Clients join room whatsapp-{companyId}
 * to receive QR, ready, disconnected, and new message events.
 */
export function setupWhatsAppHandlers(io: SocketIOServer, socket: AuthenticatedSocket): void {
  const companyId = (socket as AuthenticatedSocket).companyId;
  if (companyId == null) return;

  const room = `whatsapp-${companyId}`;
  socket.join(room);
}
