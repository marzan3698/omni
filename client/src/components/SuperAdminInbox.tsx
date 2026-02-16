import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socialApi, type SocialConversation, type SocialMessage } from '@/lib/social';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Bot, Archive, BarChart3, Share2 } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { useInboxView } from '@/contexts/InboxViewContext';
import { DistributeModal } from '@/components/DistributeModal';
import { cn } from '@/lib/utils';

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getLastMessage(conversation: SocialConversation): SocialMessage | null {
  if (conversation.messages && conversation.messages.length > 0) {
    return conversation.messages[conversation.messages.length - 1];
  }
  return null;
}

export function SuperAdminInbox() {
  const { setHideMainSidebar } = useInboxView();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showDistributeModal, setShowDistributeModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: () => socialApi.getSuperAdminStats(),
    refetchInterval: 10000,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', 'inbox'],
    queryFn: () => socialApi.getConversations('inbox'),
    refetchInterval: 10000,
  });

  const { data: selectedConversation, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () => socialApi.getConversationMessages(selectedConversationId!),
    enabled: !!selectedConversationId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    setHideMainSidebar(!!selectedConversationId);
    return () => setHideMainSidebar(false);
  }, [selectedConversationId, setHideMainSidebar]);

  const handleDistributeSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-1 flex gap-4 overflow-hidden min-w-0">
        <div className="w-80 flex-shrink-0 flex flex-col game-panel rounded-xl overflow-hidden">
          {stats && (
            <div className="p-3 border-b border-amber-500/20 bg-slate-800/60">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-amber-100">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Overview
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-800/60 p-2 border border-amber-500/20 animate-game-item-reveal">
                  <span className="text-amber-200/70 block">Total (Open)</span>
                  <span className="font-semibold text-white">{stats.totalMessages}</span>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2 border border-amber-500/20 animate-game-item-reveal" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
                  <span className="text-amber-200/70 block">Assigned</span>
                  <span className="font-semibold text-emerald-400">{stats.assignedMessages}</span>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2 border border-amber-500/20 animate-game-item-reveal" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                  <span className="text-amber-200/70 block">Archive</span>
                  <span className="font-semibold text-amber-400">{stats.unassignedMessages}</span>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2 border border-amber-500/20 animate-game-item-reveal" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                  <span className="text-amber-200/70 block">Active reps</span>
                  <span className="font-semibold text-white">{stats.activeRepsCount}</span>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-2 bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50 font-semibold"
                onClick={() => setShowDistributeModal(true)}
                disabled={statsLoading || stats.unassignedMessages === 0}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Distribute
              </Button>
            </div>
          )}
          <div className="p-4 border-b border-amber-500/20">
            <h2 className="font-semibold text-amber-100">Archive</h2>
            <p className="text-xs text-amber-200/70 mt-1">
              {conversations.length} unassigned {conversations.length === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                <Archive className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                No unassigned conversations
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {conversations.map((conv, idx) => {
                  const last = getLastMessage(conv);
                  const isSelected = selectedConversationId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={cn(
                        'w-full p-4 text-left rounded-lg game-item-card game-item-hover animate-game-item-reveal',
                        isSelected && 'game-item-selected'
                      )}
                      style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-amber-100 text-sm font-bold border-2 border-amber-500/50 bg-gradient-to-br from-amber-600 to-amber-800">
                          {conv.externalUserName ? conv.externalUserName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {conv.platform === 'facebook' && <FacebookIcon className="w-3.5 h-3.5 text-blue-400" />}
                            {conv.platform === 'whatsapp' && <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />}
                            <span className="text-sm font-medium text-amber-50 truncate">
                              {conv.externalUserName || `User ${conv.externalUserId.slice(0, 8)}`}
                            </span>
                          </div>
                          {last && <p className="text-xs text-slate-300 truncate mt-0.5">{last.content}</p>}
                          {conv.lastMessageAt && (
                            <p className="text-xs text-amber-500/80 mt-0.5">{formatTime(conv.lastMessageAt)}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col game-panel rounded-xl overflow-hidden">
          {!selectedConversationId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-amber-200/80">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-amber-500/50" />
                <p>Select a conversation to view (read-only)</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex-1 flex items-center justify-center text-amber-200/80">Loading messages...</div>
          ) : !selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-amber-200/80">Failed to load</div>
          ) : (
            <>
              <div className="p-4 border-b border-amber-500/20 bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-amber-100 text-sm font-bold border-2 border-amber-500/50 bg-gradient-to-br from-amber-600 to-amber-800">
                    {selectedConversation.externalUserName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-50">
                      {selectedConversation.externalUserName || `User ${selectedConversation.externalUserId.slice(0, 8)}`}
                    </h3>
                    <p className="text-xs text-amber-200/70">
                      {selectedConversation.platform === 'facebook' && <FacebookIcon className="w-3 h-3 inline mr-1 text-blue-600" />}
                      {selectedConversation.platform === 'whatsapp' && <WhatsAppIcon className="w-3 h-3 inline mr-1 text-green-500" />}
                      {selectedConversation.platform} {selectedConversation.whatsappSlotId ? `Slot ${selectedConversation.whatsappSlotId}` : ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((msg) => {
                    const isAgent = msg.senderType === 'agent';
                    return (
                      <div key={msg.id} className={cn('flex gap-3', isAgent ? 'justify-end' : 'justify-start')}>
                        {!isAgent && (
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg',
                            msg.imageUrl ? 'p-0 overflow-hidden' : 'px-4 py-2',
                            isAgent ? (msg.imageUrl ? 'bg-transparent' : 'bg-indigo-600 text-white') : (msg.imageUrl ? 'bg-transparent' : 'bg-gray-100 text-slate-900')
                          )}
                        >
                          {msg.imageUrl && (
                            <img
                              src={getImageUrl(msg.imageUrl)}
                              alt="Attachment"
                              className="max-w-full max-h-[300px] rounded-lg object-contain"
                              loading="lazy"
                            />
                          )}
                          {msg.content && <p className={cn('text-sm', msg.imageUrl && 'px-4 py-2')}>{msg.content}</p>}
                          <p className={cn('text-xs mt-1', isAgent ? 'text-indigo-100' : 'text-slate-500')}>{formatTime(msg.createdAt)}</p>
                        </div>
                        {isAgent && (
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-500 py-8">No messages yet</div>
                )}
              </div>
              <div className="p-3 border-t border-amber-500/20 bg-slate-800/40 text-center text-xs text-amber-200/70">
                View only. Reply and assign are available to Customer Care.
              </div>
            </>
          )}
        </div>
      </div>

      {stats && (
        <DistributeModal
          open={showDistributeModal}
          onClose={() => setShowDistributeModal(false)}
          onSuccess={handleDistributeSuccess}
          unassignedCount={stats.unassignedMessages}
          activeRepsCount={stats.activeRepsCount}
          distribute={socialApi.distributeConversations}
        />
      )}
    </div>
  );
}
