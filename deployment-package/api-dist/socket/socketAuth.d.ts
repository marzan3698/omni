import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userEmail?: string;
    companyId?: number;
    roleName?: string;
}
/**
 * Socket.IO authentication middleware
 * Validates JWT token from handshake and attaches user info to socket
 */
export declare const socketAuth: (socket: AuthenticatedSocket, next: (err?: ExtendedError) => void) => Promise<void>;
export {};
//# sourceMappingURL=socketAuth.d.ts.map