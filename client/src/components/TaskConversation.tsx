import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Image as ImageIcon, Mic, Link as LinkIcon, Paperclip, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AudioRecorder } from './AudioRecorder';
import { AttachmentUploader } from './AttachmentUploader';
import { AttachmentGrid } from './AttachmentGrid';
import { AudioAttachment } from './AudioAttachment';
import { useTaskConversationSocket } from '@/hooks/useTaskConversationSocket';
import type { TaskAttachment, TaskMessageType } from '@/types';
import { formatBangladeshiDateTime, getStaticFileUrl } from '@/lib/utils';

interface TaskConversationProps {
  taskId: number;
  companyId: number;
  className?: string;
}

interface TaskMessage {
  id: number;
  senderId: string;
  content?: string | null;
  messageType: TaskMessageType;
  attachmentId?: number | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    name?: string | null;
    profileImage?: string | null;
  };
  attachment?: TaskAttachment | null;
}

export function TaskConversation({
  taskId,
  companyId,
  className,
}: TaskConversationProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Socket.IO for real-time updates
  const {
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
    markOnline,
    markOffline,
    isConnected,
    typingUsers,
    onlineUsers,
  } = useTaskConversationSocket({
    taskId,
    companyId,
    enabled: !!taskId && !!companyId,
  });

  // Fetch messages (initial load only, no polling)
  const { data: messagesResponse, isLoading } = useQuery({
    queryKey: ['task-messages', taskId, companyId],
    queryFn: async () => {
      const response = await taskApi.getMessages(taskId, companyId, 1, 100);
      return response.data.data || { messages: [], pagination: {} };
    },
    enabled: !!taskId && !!companyId,
    staleTime: Infinity, // Messages never go stale - they persist in database
    gcTime: Infinity, // Keep in cache indefinitely (was cacheTime)
    // Removed refetchInterval - Socket.IO handles real-time updates
  });

  const messages: TaskMessage[] = messagesResponse?.messages || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message via Socket.IO (real-time)
  const handleSendSocketMessage = (data: {
    content?: string;
    messageType?: 'text' | 'image' | 'file' | 'audio' | 'system';
    attachmentId?: number;
  }) => {
    if (!isConnected) {
      // Fallback to REST API if Socket.IO not connected
      sendMessageMutation.mutate(data);
      return;
    }

    sendSocketMessage(data);
    setMessageText('');
    setSelectedFile(null);
    setShowAttachmentUploader(false);
    stopTyping();
  };

  // Fallback REST API mutation (for when Socket.IO is not available)
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content?: string; messageType?: string; attachmentId?: number }) => {
      return await taskApi.sendMessage(taskId, data, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-messages', taskId, companyId] });
      setMessageText('');
      setSelectedFile(null);
      setShowAttachmentUploader(false);
    },
  });

  // Upload attachment mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId.toString());
      formData.append('companyId', companyId.toString());
      
      const response = await taskApi.uploadAttachment(taskId, file, companyId);
      return response.data.data;
    },
    onSuccess: (attachment) => {
      // Send message with attachment via Socket.IO
      handleSendSocketMessage({
        content: messageText || undefined,
        messageType: attachment.fileType === 'image' ? 'image' : 'file',
        attachmentId: attachment.id,
      });
    },
  });

  // Upload audio mutation
  const uploadAudioMutation = useMutation({
    mutationFn: async ({ blob, mimeType, duration }: { blob: Blob; mimeType: string; duration: number }) => {
      return await taskApi.uploadAudio(taskId, blob, mimeType, duration, companyId);
    },
    onSuccess: (response) => {
      const attachment = response.data.data;
      if (attachment && attachment.id) {
        handleSendSocketMessage({
          content: messageText || undefined,
          messageType: 'audio',
          attachmentId: attachment.id,
        });
        setShowAudioRecorder(false);
        setMessageText(''); // Clear message text after sending
      } else {
        console.error('Audio upload failed: No attachment ID returned');
        alert('Failed to upload audio. Please try again.');
      }
    },
    onError: (error: any) => {
      console.error('Error uploading audio:', error);
      alert(error?.response?.data?.message || 'Failed to upload audio. Please try again.');
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() && !selectedFile && !showAudioRecorder) return;

    if (selectedFile) {
      uploadAttachmentMutation.mutate(selectedFile);
    } else if (!showAudioRecorder) {
      handleSendSocketMessage({
        content: messageText,
        messageType: 'text',
      });
    }
  };

  // Typing detection
  useEffect(() => {
    if (!messageText.trim()) {
      stopTyping();
      return;
    }

    // Start typing indicator
    startTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, startTyping, stopTyping]);

  // Mark online when component mounts
  useEffect(() => {
    markOnline();
    return () => {
      markOffline();
    };
  }, [markOnline, markOffline]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
  };

  // Get typing user names (for display)
  const typingUserNames = Array.from(typingUsers).map((userId) => {
    // Find user in messages to get their name
    const userMessage = messages.find((m) => m.senderId === userId);
    return userMessage?.sender.name || userMessage?.sender.email || 'Someone';
  });

  return (
    <div className={cn('flex flex-col h-full border border-gray-200 rounded-lg bg-white', className)}>
      {/* Connection status and online users */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')} />
          <span className="text-xs text-slate-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {onlineUsers.size > 0 && (
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 text-green-500 fill-green-500" />
            <span className="text-xs text-slate-600">
              {onlineUsers.size} {onlineUsers.size === 1 ? 'user' : 'users'} online
            </span>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[600px]">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                isCurrentUser(message.senderId) ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {message.sender.profileImage ? (
                  <img
                    src={message.sender.profileImage}
                    alt={message.sender.name || message.sender.email}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-600">
                      {(message.sender.name || message.sender.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Message content */}
              <div className={cn('flex-1 max-w-[70%]', isCurrentUser(message.senderId) ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'rounded-lg p-3',
                    isCurrentUser(message.senderId)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-slate-900'
                  )}
                >
                  {/* Text content */}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  )}

                  {/* Attachment */}
                  {message.attachment && (
                    <div className="mt-2">
                      {message.attachment.fileType === 'image' && message.attachment.fileUrl && (
                        <img
                          src={getStaticFileUrl(message.attachment.fileUrl)}
                          alt="Attachment"
                          className="max-w-xs rounded"
                        />
                      )}
                      {message.attachment.fileType === 'audio' && message.attachment.fileUrl && (
                        <AudioAttachment
                          url={message.attachment.fileUrl}
                          fileName={message.attachment.fileName || undefined}
                          duration={message.attachment.duration || undefined}
                          className="max-w-md"
                        />
                      )}
                      {message.attachment.fileType === 'file' && (
                        <p className="text-xs opacity-75">File: {message.attachment.fileName}</p>
                      )}
                      {message.attachment.fileType === 'pdf' && message.attachment.fileUrl && (
                        <a
                          href={getStaticFileUrl(message.attachment.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                        >
                          📄 {message.attachment.fileName || 'PDF Document'}
                        </a>
                      )}
                      {message.attachment.fileType === 'video' && message.attachment.fileUrl && (
                        <video
                          src={getStaticFileUrl(message.attachment.fileUrl)}
                          controls
                          className="max-w-xs rounded"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className={cn('text-xs mt-1', isCurrentUser(message.senderId) ? 'text-indigo-100' : 'text-slate-500')}>
                    {formatBangladeshiDateTime(new Date(message.createdAt))}
                  </p>
                </div>

                {/* Sender name (for other users) */}
                {!isCurrentUser(message.senderId) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {message.sender.name || message.sender.email}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUserNames.length > 0 && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-slate-400">...</span>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm text-slate-600 italic">
                {typingUserNames.length === 1
                  ? `${typingUserNames[0]} is typing...`
                  : `${typingUserNames.join(', ')} are typing...`}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Audio recorder */}
      {showAudioRecorder && (
        <div className="p-4 border-t border-gray-200">
          <AudioRecorder
            onRecordingComplete={(blob, mimeType, duration) => {
              uploadAudioMutation.mutate({ blob, mimeType, duration });
            }}
            onCancel={() => setShowAudioRecorder(false)}
          />
        </div>
      )}

      {/* Attachment uploader */}
      {showAttachmentUploader && (
        <div className="p-4 border-t border-gray-200">
          <AttachmentUploader
            onFileSelect={(file) => {
              setSelectedFile(file);
            }}
            onLinkAdd={(url) => {
              // Handle link attachment
              taskApi.addLinkAttachment({
                taskId,
                linkUrl: url,
                companyId,
              }).then((response) => {
                const attachment = response.data.data;
                handleSendSocketMessage({
                  content: messageText || undefined,
                  messageType: 'text',
                  attachmentId: attachment.id,
                });
                setShowAttachmentUploader(false);
              });
            }}
            onRemove={() => {
              setSelectedFile(null);
            }}
            taskId={taskId}
          />
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sendMessageMutation.isPending || showAudioRecorder || !isConnected}
            className="flex-1"
          />
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAttachmentUploader(!showAttachmentUploader);
                setShowAudioRecorder(false);
              }}
              disabled={sendMessageMutation.isPending || showAudioRecorder}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAudioRecorder(!showAudioRecorder);
                setShowAttachmentUploader(false);
              }}
              disabled={sendMessageMutation.isPending || showAttachmentUploader}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={
                (!messageText.trim() && !selectedFile && !showAudioRecorder) ||
                sendMessageMutation.isPending ||
                !isConnected
              }
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-2 text-xs text-slate-500">
            Selected: {selectedFile.name}
          </div>
        )}
      </div>
    </div>
  );
}

