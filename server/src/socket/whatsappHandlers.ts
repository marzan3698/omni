import { Server as SocketIOServer, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  companyId?: number;
}

const SLOT_IDS = ['1', '2', '3', '4', '5'];

/**
 * Setup WhatsApp Socket.IO handlers. Clients join rooms whatsapp-{companyId}-{slotId}
 * for each slot so they receive QR, ready, disconnected, and new message events per slot.
 */
export function setupWhatsAppHandlers(io: SocketIOServer, socket: AuthenticatedSocket): void {
  const companyId = (socket as AuthenticatedSocket).companyId;
  if (companyId == null) return;

  for (const slotId of SLOT_IDS) {
    socket.join(`whatsapp-${companyId}-${slotId}`);
  }
}
