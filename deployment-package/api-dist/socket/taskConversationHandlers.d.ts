import { Server as SocketIOServer, Socket } from 'socket.io';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userEmail?: string;
    companyId?: number;
    roleName?: string;
}
/**
 * Setup task conversation Socket.IO event handlers
 */
export declare function setupTaskConversationHandlers(io: SocketIOServer, socket: AuthenticatedSocket): void;
export {};
//# sourceMappingURL=taskConversationHandlers.d.ts.map