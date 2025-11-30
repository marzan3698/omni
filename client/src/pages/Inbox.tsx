import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi, type SocialConversation, type SocialMessage } from '@/lib/social';
import { leadApi, leadCategoryApi, leadInterestApi, campaignApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, User, Bot, Target, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';

// Predefined quick reply greeting messages
const QUICK_REPLIES = [
  'Hello! How can I help you today?',
  'Hi! Thanks for reaching out.',
  'Good morning! How may I assist you?',
  'Good afternoon! What can I do for you?',
  'Hello! Welcome to our service.',
  'Hi there! I\'m here to help.',
  'Thank you for contacting us!',
  'Hello! How are you doing today?',
];

export function Inbox() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    title: '',
    description: '',
    value: '',
    assignedTo: '',
    customerName: '',
    phone: '',
    categoryId: '',
    interestId: '',
    campaignId: '',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversations with auto-refresh every 10 seconds
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => socialApi.getConversations(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch messages for selected conversation with auto-refresh
  const { data: selectedConversation, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () => socialApi.getConversationMessages(selectedConversationId!),
    enabled: !!selectedConversationId,
    refetchInterval: 5000, // Refresh every 5 seconds when conversation is selected
  });

  // Fetch lead categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['lead-categories'],
    queryFn: async () => {
      const response = await leadCategoryApi.getAll(user?.companyId || 0);
      return response.data.data || [];
    },
    enabled: !!user?.companyId && showLeadModal,
  });

  // Fetch lead interests
  const { data: interestsResponse } = useQuery({
    queryKey: ['lead-interests'],
    queryFn: async () => {
      const response = await leadInterestApi.getAll(user?.companyId || 0);
      return response.data.data || [];
    },
    enabled: !!user?.companyId && showLeadModal,
  });

  // Fetch active campaigns
  const { data: campaignsResponse } = useQuery({
    queryKey: ['campaigns-active', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await campaignApi.getActive(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId && showLeadModal,
  });

  const categories = categoriesResponse || [];
  const interests = interestsResponse || [];
  const campaigns = campaignsResponse || [];

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: (content: string) => socialApi.sendReply(selectedConversationId!, content),
    onSuccess: () => {
      setMessageText('');
      // Refetch conversations and messages
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
    },
  });

  // Create lead from conversation mutation
  const createLeadMutation = useMutation({
    mutationFn: (data: any) => {
      if (!selectedConversationId) {
        throw new Error('Conversation ID is required');
      }
      return leadApi.createFromInbox(selectedConversationId, data);
    },
    onSuccess: () => {
      setShowLeadModal(false);
      setLeadFormData({ title: '', description: '', value: '', assignedTo: '', customerName: '', phone: '', categoryId: '', interestId: '', campaignId: '' });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      alert('Lead created successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create lead');
    },
  });

  const handleCreateLead = () => {
    if (!selectedConversation) return;
    
    // Pre-fill form with conversation data
    const defaultTitle = selectedConversation.externalUserName 
      ? `Lead from ${selectedConversation.externalUserName}`
      : `Lead from ${selectedConversation.platform}`;
    
    setLeadFormData({
      title: defaultTitle,
      description: selectedConversation.messages?.[0]?.content || '',
      value: '',
      assignedTo: '',
      customerName: selectedConversation.externalUserName || '',
      phone: '',
      categoryId: '',
      interestId: '',
      campaignId: '',
    });
    setShowLeadModal(true);
  };

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFormData.title.trim()) {
      alert('Lead title is required');
      return;
    }
    if (!leadFormData.customerName?.trim()) {
      alert('Customer name is required');
      return;
    }
    if (!leadFormData.phone?.trim()) {
      alert('Phone is required');
      return;
    }
    if (!leadFormData.categoryId || leadFormData.categoryId === '') {
      alert('Category is required');
      return;
    }
    if (!leadFormData.interestId || leadFormData.interestId === '') {
      alert('Interest is required');
      return;
    }

    // Ensure categoryId and interestId are numbers, not undefined
    const categoryIdNum = leadFormData.categoryId && leadFormData.categoryId !== '' 
      ? parseInt(leadFormData.categoryId, 10) 
      : null;
    const interestIdNum = leadFormData.interestId && leadFormData.interestId !== '' 
      ? parseInt(leadFormData.interestId, 10) 
      : null;

    if (!categoryIdNum || isNaN(categoryIdNum)) {
      alert('Please select a category');
      return;
    }

    if (!interestIdNum || isNaN(interestIdNum)) {
      alert('Please select an interest');
      return;
    }

    const campaignIdNum = leadFormData.campaignId && leadFormData.campaignId !== '' 
      ? parseInt(leadFormData.campaignId, 10) 
      : undefined;

    createLeadMutation.mutate({
      title: leadFormData.title,
      description: leadFormData.description || undefined,
      value: leadFormData.value ? parseFloat(leadFormData.value) : undefined,
      assignedTo: leadFormData.assignedTo ? parseInt(leadFormData.assignedTo, 10) : undefined,
      customerName: leadFormData.customerName || undefined,
      phone: leadFormData.phone || undefined,
      categoryId: categoryIdNum,
      interestId: interestIdNum,
      campaignId: campaignIdNum,
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversationId) return;

    sendReplyMutation.mutate(messageText.trim());
  };

  const handleQuickReplyClick = (message: string) => {
    setMessageText(message);
    setShowQuickReplies(false);
    // Focus on the input after setting the message
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
      if (input) {
        input.focus();
        // Move cursor to end of text
        input.setSelectionRange(message.length, message.length);
      }
    }, 0);
  };

  const formatTime = (dateString: string) => {
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
  };

  const getLastMessage = (conversation: SocialConversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      return conversation.messages[conversation.messages.length - 1];
    }
    return null;
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900">Inbox</h1>
        <p className="text-slate-600 mt-1">Manage your social media conversations</p>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Column: Conversation List */}
        <Card className="w-80 flex flex-col shadow-sm border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-slate-900">Conversations</h2>
            <p className="text-xs text-slate-500 mt-1">
              {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-4 text-center text-slate-500">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => {
                  const lastMessage = getLastMessage(conversation);
                  const isSelected = selectedConversationId === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={cn(
                        'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                        isSelected && 'bg-indigo-50 border-l-4 border-indigo-600'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {conversation.externalUserName ? (
                            <span className="text-white text-sm font-medium">
                              {conversation.externalUserName.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {conversation.externalUserName || `User ${conversation.externalUserId.slice(0, 8)}`}
                            </p>
                            {conversation.status === 'Open' && (
                              <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-xs text-slate-500 truncate mb-1">
                              {lastMessage.content}
                            </p>
                          )}
                          {conversation.lastMessageAt && (
                            <p className="text-xs text-slate-400">
                              {formatTime(conversation.lastMessageAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Chat Window */}
        <Card className="flex-1 flex flex-col shadow-sm border-gray-200">
          {!selectedConversationId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-slate-500">Loading messages...</div>
            </div>
          ) : !selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-slate-500">Failed to load conversation</div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                      {selectedConversation.externalUserName ? (
                        <span className="text-white text-sm font-medium">
                          {selectedConversation.externalUserName.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {selectedConversation.externalUserName || `User ${selectedConversation.externalUserId.slice(0, 8)}`}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedConversation.platform} • {selectedConversation.status}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        selectedConversation.status === 'Open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {selectedConversation.status}
                    </span>
                  </div>
                  <PermissionGuard permission="can_manage_leads">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateLead}
                      className="ml-4"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Create Lead
                    </Button>
                  </PermissionGuard>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((message) => {
                    const isAgent = message.senderType === 'agent';

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          isAgent ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {!isAgent && (
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg px-4 py-2',
                            isAgent
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-slate-900'
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              'text-xs mt-1',
                              isAgent ? 'text-indigo-100' : 'text-slate-500'
                            )}
                          >
                            {formatTime(message.createdAt)}
                          </p>
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
                  <div className="text-center text-slate-500 py-8">
                    No messages yet. Start the conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {selectedConversationId && (
                <div className="px-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-slate-700">Quick Replies</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className="h-6 px-2 text-xs"
                    >
                      {showQuickReplies ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  {showQuickReplies && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {QUICK_REPLIES.map((reply, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleQuickReplyClick(reply)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1"
                    disabled={sendReplyMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || sendReplyMutation.isPending}
                  >
                    {sendReplyMutation.isPending ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Create Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create Lead from Conversation</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLeadModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitLead} className="space-y-4">
                <div>
                  <Label htmlFor="lead-title">Lead Title *</Label>
                  <Input
                    id="lead-title"
                    value={leadFormData.title}
                    onChange={(e) => setLeadFormData({ ...leadFormData, title: e.target.value })}
                    placeholder="Enter lead title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lead-customer-name">Customer Name *</Label>
                  <Input
                    id="lead-customer-name"
                    value={leadFormData.customerName}
                    onChange={(e) => setLeadFormData({ ...leadFormData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lead-phone">Phone *</Label>
                  <Input
                    id="lead-phone"
                    type="tel"
                    value={leadFormData.phone}
                    onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lead-category">Category *</Label>
                  <select
                    id="lead-category"
                    value={leadFormData.categoryId}
                    onChange={(e) => setLeadFormData({ ...leadFormData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="lead-interest">Interest *</Label>
                  <select
                    id="lead-interest"
                    value={leadFormData.interestId}
                    onChange={(e) => setLeadFormData({ ...leadFormData, interestId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select interest</option>
                    {interests.map((int: any) => (
                      <option key={int.id} value={int.id}>
                        {int.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="lead-campaign">Select Campaign</Label>
                  <select
                    id="lead-campaign"
                    value={leadFormData.campaignId}
                    onChange={(e) => setLeadFormData({ ...leadFormData, campaignId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No campaign (optional)</option>
                    {campaigns.map((campaign: any) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name} - {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="lead-description">Description</Label>
                  <textarea
                    id="lead-description"
                    value={leadFormData.description}
                    onChange={(e) => setLeadFormData({ ...leadFormData, description: e.target.value })}
                    placeholder="Enter lead description"
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-value">Estimated Value</Label>
                  <Input
                    id="lead-value"
                    type="number"
                    step="0.01"
                    value={leadFormData.value}
                    onChange={(e) => setLeadFormData({ ...leadFormData, value: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-assigned">Assign To (Employee ID)</Label>
                  <Input
                    id="lead-assigned"
                    type="number"
                    value={leadFormData.assignedTo}
                    onChange={(e) => setLeadFormData({ ...leadFormData, assignedTo: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLeadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLeadMutation.isPending}
                  >
                    {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

