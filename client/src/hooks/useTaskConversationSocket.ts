import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskMessage } from '@/types';

interface UseTaskConversationSocketProps {
  taskId: number;
  companyId: number;
  enabled?: boolean;
}

interface UseTaskConversationSocketReturn {
  sendMessage: (data: {
    content?: string;
    messageType?: 'text' | 'image' | 'file' | 'audio' | 'system';
    attachmentId?: number;
  }) => void;
  startTyping: () => void;
  stopTyping: () => void;
  markOnline: () => void;
  markOffline: () => void;
  isConnected: boolean;
  typingUsers: Set<string>;
  onlineUsers: Set<string>;
}

/**
 * Custom hook for task conversation Socket.IO events
 */
export function useTaskConversationSocket({
  taskId,
  companyId,
  enabled = true,
}: UseTaskConversationSocketProps): UseTaskConversationSocketReturn {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingUsersRef = useRef<Set<string>>(new Set());
  const onlineUsersRef = useRef<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const hasJoinedRef = useRef(false);

  // Join/leave task room
  useEffect(() => {
    if (!socket || !enabled || !taskId || !companyId || hasJoinedRef.current) {
      return;
    }

    // Join task room
    socket.emit('join-task-room', { taskId, companyId });
    hasJoinedRef.current = true;

    // Mark as online
    socket.emit('mark-online', { taskId, companyId });

    // Leave room on cleanup
    return () => {
      if (socket && hasJoinedRef.current) {
        socket.emit('leave-task-room', { taskId, companyId });
        socket.emit('mark-offline', { taskId, companyId });
        hasJoinedRef.current = false;
      }
    };
  }, [socket, enabled, taskId, companyId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleNewMessage = (data: { message: TaskMessage; taskId: number }) => {
      if (data.taskId === taskId && data.message) {
        // Update the query cache directly with the new message
        queryClient.setQueryData(
          ['task-messages', taskId, companyId],
          (oldData: any) => {
            // Don't overwrite if oldData doesn't exist yet (wait for initial fetch)
            // This prevents clearing messages on page reload
            if (!oldData || !oldData.messages) {
              // If we don't have existing data, don't create new cache entry
              // Let the useQuery handle the initial fetch
              return oldData;
            }

            // Check if message already exists (avoid duplicates)
            const existingMessage = oldData.messages?.find((m: TaskMessage) => m.id === data.message.id);
            if (existingMessage) {
              return oldData;
            }

            // Add new message to the end of the list (messages are sorted oldest first)
            const updatedMessages = [...(oldData.messages || []), data.message];
            
            // Sort by createdAt to ensure proper ordering
            updatedMessages.sort((a: TaskMessage, b: TaskMessage) => {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });

            return {
              ...oldData,
              messages: updatedMessages,
            };
          }
        );
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, enabled, taskId, companyId, queryClient]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket || !enabled || !user) return;

    const handleUserTyping = (data: {
      userId: string;
      userEmail: string;
      taskId: number;
    }) => {
      if (data.taskId === taskId && data.userId !== user.id) {
        typingUsersRef.current.add(data.userId);
        setTypingUsers(new Set(typingUsersRef.current));

        // Auto-remove typing indicator after 3 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          typingUsersRef.current.delete(data.userId);
          setTypingUsers(new Set(typingUsersRef.current));
        }, 3000);
      }
    };

    const handleUserStoppedTyping = (data: {
      userId: string;
      userEmail: string;
      taskId: number;
    }) => {
      if (data.taskId === taskId && data.userId !== user.id) {
        typingUsersRef.current.delete(data.userId);
        setTypingUsers(new Set(typingUsersRef.current));
      }
    };

    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);

    return () => {
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, enabled, taskId, user]);

  // Listen for online/offline status
  useEffect(() => {
    if (!socket || !enabled || !user) return;

    const handleUserOnline = (data: {
      userId: string;
      userEmail: string;
      taskId: number;
    }) => {
      if (data.taskId === taskId && data.userId !== user.id) {
        onlineUsersRef.current.add(data.userId);
        setOnlineUsers(new Set(onlineUsersRef.current));
      }
    };

    const handleUserOffline = (data: {
      userId: string;
      userEmail: string;
      taskId: number;
    }) => {
      if (data.taskId === taskId && data.userId !== user.id) {
        onlineUsersRef.current.delete(data.userId);
        setOnlineUsers(new Set(onlineUsersRef.current));
      }
    };

    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);

    return () => {
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
    };
  }, [socket, enabled, taskId, user]);

  // Send message handler
  const sendMessage = useCallback(
    (data: {
      content?: string;
      messageType?: 'text' | 'image' | 'file' | 'audio' | 'system';
      attachmentId?: number;
    }) => {
      if (!socket || !isConnected) {
        console.error('Socket not connected');
        return;
      }

      socket.emit('send-message', {
        taskId,
        companyId,
        ...data,
      });
    },
    [socket, isConnected, taskId, companyId]
  );

  // Typing handlers
  const startTyping = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit('typing-start', { taskId, companyId });
  }, [socket, isConnected, taskId, companyId]);

  const stopTyping = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit('typing-stop', { taskId, companyId });
  }, [socket, isConnected, taskId, companyId]);

  // Online/offline handlers
  const markOnline = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit('mark-online', { taskId, companyId });
  }, [socket, isConnected, taskId, companyId]);

  const markOffline = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit('mark-offline', { taskId, companyId });
  }, [socket, isConnected, taskId, companyId]);

  return {
    sendMessage,
    startTyping,
    stopTyping,
    markOnline,
    markOffline,
    isConnected,
    typingUsers,
    onlineUsers,
  };
}

