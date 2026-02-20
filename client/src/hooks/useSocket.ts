import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
}

/**
 * Custom hook for Socket.IO connection management
 */
export function useSocket(): UseSocketReturn {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Get API URL — e.g. http://localhost:5001/api OR https://imoics.com/api
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const parsedUrl = new URL(apiUrl);
    const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';

    // Connect to the origin (no path in URL)
    const socketUrl = parsedUrl.origin;

    // Always use the API path prefix for Socket.IO connections. 
    // In production (cPanel), Passenger proxies /api/* to Node.js, so requests arrive as /api/socket.io.
    // Locally, we will align the server to also listen on /api/socket.io.
    const socketPath = `${parsedUrl.pathname.replace(/\/$/, '')}/socket.io`; // e.g. /api/socket.io

    // Create Socket.IO connection
    const newSocket = io(socketUrl, {
      path: socketPath,
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket.IO connected:', newSocket.id);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('reconnect_error', (err) => {
      console.error('Socket.IO reconnection error:', err);
      setError(err.message || 'Reconnection failed');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
      setError('Failed to reconnect. Please refresh the page.');
    });

    // Cleanup on unmount or user change
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  return {
    socket,
    isConnected,
    error,
  };
}

