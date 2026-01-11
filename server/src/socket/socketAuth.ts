import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { authService } from '../services/auth.service.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

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
export const socketAuth = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication token required'));
    }

    // Verify token
    const payload = authService.verifyToken(token);

    // Get user with role for additional info
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: true },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user info to socket
    socket.userId = user.id;
    socket.userEmail = user.email;
    socket.companyId = user.companyId;
    socket.roleName = user.role.name;

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    if (error instanceof AppError) {
      return next(new Error(error.message));
    }
    return next(new Error('Authentication failed'));
  }
};

