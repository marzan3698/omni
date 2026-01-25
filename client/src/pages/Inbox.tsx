import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi, type SocialConversation, type SocialMessage, type ConversationLabel } from '@/lib/social';
import { leadApi, leadCategoryApi, leadInterestApi, campaignApi, productApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, User, Bot, Target, X, Zap, Package, Image as ImageIcon, Check, CheckCheck, Clock, ShoppingCart, Users, Search, BarChart3, ChevronLeft, ChevronRight, Tag, Edit, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageUtils';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ErrorAlert } from '@/components/ErrorAlert';

// Facebook Icon Component
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

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
  const [activeTab, setActiveTab] = useState<'inbox' | 'taken' | 'complete'>('inbox');
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showReleaseHistoryModal, setShowReleaseHistoryModal] = useState(false);
  const [releaseHistoryConversationId, setReleaseHistoryConversationId] = useState<number | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<ConversationLabel | null>(null);
  const [labelFormData, setLabelFormData] = useState({ name: '', source: '' });
  const [quickReplyTab, setQuickReplyTab] = useState<'default' | 'campaign' | 'all'>('default');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | ''>('');
  
  // Multi-step lead form state
  const [leadType, setLeadType] = useState<'sales' | 'connection' | 'research' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<any | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Fetch conversations with auto-refresh every 10 seconds
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', activeTab],
    queryFn: () => socialApi.getConversations(activeTab),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch messages for selected conversation with auto-refresh
  const { data: selectedConversation, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () => socialApi.getConversationMessages(selectedConversationId!),
    enabled: !!selectedConversationId,
    refetchInterval: 5000, // Refresh every 5 seconds when conversation is selected
  });

  // Fetch typing indicator status
  const { data: typingStatus } = useQuery({
    queryKey: ['typing-status', selectedConversationId],
    queryFn: () => socialApi.getTypingStatus(selectedConversationId!),
    enabled: !!selectedConversationId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (conversationId: number) => socialApi.markConversationAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
    },
  });

  // Update typing status mutation
  const updateTypingMutation = useMutation({
    mutationFn: ({ conversationId, isTyping }: { conversationId: number; isTyping: boolean }) =>
      socialApi.updateTypingStatus(conversationId, isTyping),
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

  // Fetch products for Sales Lead product selection
  const { data: products = [] } = useQuery({
    queryKey: ['products', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await productApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId && showLeadModal && leadType === 'sales' && currentStep >= 2,
  });

  // Fetch active campaigns for quick replies
  const { data: activeCampaigns = [] } = useQuery({
    queryKey: ['active-campaigns', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await campaignApi.getActive(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  // Fetch campaign products when campaign is selected
  const { data: campaignProducts = [] } = useQuery({
    queryKey: ['campaign-products', selectedCampaignId, user?.companyId],
    queryFn: async () => {
      if (!selectedCampaignId || !user?.companyId) return [];
      const response = await campaignApi.getProducts(Number(selectedCampaignId), user.companyId);
      return response.data.data || [];
    },
    enabled: !!selectedCampaignId && !!user?.companyId && quickReplyTab === 'campaign',
  });

  // Fetch all products for "All Products" tab
  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await productApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId && quickReplyTab === 'all',
  });

  // Fetch active campaigns for lead modal
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
    mutationFn: ({ content, image }: { content: string; image?: File }) =>
      socialApi.sendReply(selectedConversationId!, content, image),
    onSuccess: () => {
      setMessageText('');
      setSelectedImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Refetch conversations and messages
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
    },
    onError: (error: any) => {
      console.error('❌ Error sending message:', error);
      setError(error);
    },
  });

  // Handle image selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  }, []);

  // Remove image preview
  const handleRemoveImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imagePreview]);

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
      setLeadFormData({ title: '', description: '', customerName: '', phone: '', categoryId: '', interestId: '', campaignId: '' });
      setLeadType(null);
      setCurrentStep(1);
      setSelectedProductId(null);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      alert('Lead created successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create lead');
    },
  });

  // Assign conversation mutation
  const assignConversationMutation = useMutation({
    mutationFn: (conversationId: number) => socialApi.assignConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'inbox'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'taken'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to assign conversation');
    },
  });

  // Unassign conversation mutation
  const unassignConversationMutation = useMutation({
    mutationFn: (conversationId: number) => socialApi.unassignConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'inbox'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'taken'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to unassign conversation');
    },
  });

  // Complete conversation mutation
  const completeConversationMutation = useMutation({
    mutationFn: (conversationId: number) => socialApi.completeConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'inbox'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'taken'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'complete'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to complete conversation');
    },
  });

  // Add label mutation
  const addLabelMutation = useMutation({
    mutationFn: ({ conversationId, labelData }: { conversationId: number; labelData: { name: string; source?: string | null } }) =>
      socialApi.addLabel(conversationId, labelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
      setLabelFormData({ name: '', source: '' });
      setEditingLabel(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add label');
    },
  });

  // Update label mutation
  const updateLabelMutation = useMutation({
    mutationFn: ({ conversationId, labelId, labelData }: { conversationId: number; labelId: number; labelData: { name?: string; source?: string | null } }) =>
      socialApi.updateLabel(conversationId, labelId, labelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
      setLabelFormData({ name: '', source: '' });
      setEditingLabel(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update label');
    },
  });

  // Delete label mutation
  const deleteLabelMutation = useMutation({
    mutationFn: ({ conversationId, labelId }: { conversationId: number; labelId: number }) =>
      socialApi.deleteLabel(conversationId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete label');
    },
  });

  // Fetch release history
  const { data: releaseHistory = [], isLoading: releaseHistoryLoading } = useQuery({
    queryKey: ['conversation-release-history', releaseHistoryConversationId],
    queryFn: async () => {
      if (!releaseHistoryConversationId) return [];
      return await socialApi.getConversationReleaseHistory(releaseHistoryConversationId);
    },
    enabled: !!releaseHistoryConversationId && showReleaseHistoryModal,
  });

  const handleShowReleaseHistory = (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setReleaseHistoryConversationId(conversationId);
    setShowReleaseHistoryModal(true);
  };

  const handleCreateLead = () => {
    if (!selectedConversation) return;

    // Reset multi-step form state
    setLeadType(null);
    setCurrentStep(1);
    setSelectedProductId(null);

    // Pre-fill form with conversation data
    const defaultTitle = selectedConversation.externalUserName
      ? `Lead from ${selectedConversation.externalUserName}`
      : `Lead from ${selectedConversation.platform}`;

    setLeadFormData({
      title: defaultTitle,
      description: selectedConversation.messages?.[0]?.content || '',
      customerName: selectedConversation.externalUserName || '',
      phone: '',
      categoryId: '',
      interestId: '',
      campaignId: '',
    });
    setShowLeadModal(true);
  };

  // Calculate total steps based on lead type
  const getTotalSteps = () => {
    if (!leadType) return 1;
    if (leadType === 'sales') return 4; // Type → Product → Customer → Details
    return 3; // Type → Basic Info → Additional Details (Connection/Research)
  };

  const totalSteps = getTotalSteps();

  // Get modal title based on current step and lead type
  const getModalTitle = () => {
    if (currentStep === 1) return 'Select Lead Type';
    if (!leadType) return 'Create Lead from Conversation';
    
    if (leadType === 'sales') {
      if (currentStep === 2) return 'Product Selection';
      if (currentStep === 3) return 'Customer Information';
      if (currentStep === 4) return 'Lead Details';
    } else if (leadType === 'connection') {
      if (currentStep === 2) return 'Basic Information';
      if (currentStep === 3) return 'Additional Details';
    } else if (leadType === 'research') {
      if (currentStep === 2) return 'Basic Information';
      if (currentStep === 3) return 'Research Details';
    }
    
    return 'Create Lead from Conversation';
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

    // Campaign is now required
    if (!leadFormData.campaignId || leadFormData.campaignId === '') {
      alert('Campaign is required');
      return;
    }

    const campaignIdNum = leadFormData.campaignId && leadFormData.campaignId !== ''
      ? parseInt(leadFormData.campaignId, 10)
      : null;

    if (!campaignIdNum || isNaN(campaignIdNum)) {
      alert('Please select a valid campaign');
      return;
    }

    // For Sales Lead, validate product selection
    if (leadType === 'sales' && !selectedProductId) {
      alert('Please select a product');
      return;
    }

    // Auto-generate title for Sales Lead if not provided
    let finalTitle = leadFormData.title;
    if (leadType === 'sales' && selectedProductId) {
      const selectedProduct = products.find((p: any) => p.id === selectedProductId);
      if (selectedProduct && !leadFormData.title.includes(selectedProduct.name)) {
        finalTitle = `${selectedProduct.name} - ${leadFormData.customerName}`;
      }
    }

    // Prepare lead data
    const leadData: any = {
      title: finalTitle,
      description: leadFormData.description || undefined,
      customerName: leadFormData.customerName || undefined,
      phone: leadFormData.phone || undefined,
      categoryId: categoryIdNum,
      interestId: interestIdNum,
      campaignId: campaignIdNum, // Required field
    };

    // For Sales Lead, add product pricing information
    if (leadType === 'sales' && selectedProductId) {
      const selectedProduct = products.find((p: any) => p.id === selectedProductId);
      if (selectedProduct) {
        const purchasePrice = parseFloat(selectedProduct.purchasePrice) || 0;
        const salePrice = parseFloat(selectedProduct.salePrice) || 0;
        const profit = salePrice - purchasePrice;
        
        leadData.productId = selectedProductId;
        leadData.purchasePrice = purchasePrice;
        leadData.salePrice = salePrice;
        leadData.profit = profit;
      }
    }

    createLeadMutation.mutate(leadData, {
      onSuccess: () => {
        // Reset form state
        setShowLeadModal(false);
        setLeadType(null);
        setCurrentStep(1);
        setSelectedProductId(null);
        setLeadFormData({
          title: '',
          description: '',
          customerName: '',
          phone: '',
          categoryId: '',
          interestId: '',
          campaignId: '',
        });
      }
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId) return;

    // Must have either text or image
    if (!messageText.trim() && !selectedImage) return;

    sendReplyMutation.mutate({
      content: messageText.trim(),
      image: selectedImage || undefined,
    });
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

  // Calculate unread count for a conversation (use backend-provided count or calculate from messages)
  const getUnreadCount = (conversation: SocialConversation): number => {
    // Use unreadCount from backend if available
    if (conversation.unreadCount !== undefined) {
      return conversation.unreadCount;
    }
    // Fallback: calculate from messages array (for compatibility)
    if (!conversation.messages) return 0;
    return conversation.messages.filter(
      (msg) => msg.senderType === 'customer' && !msg.isRead
    ).length;
  };

  // Handle conversation selection and auto-mark as read
  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    // Mark as read when conversation is selected
    markAsReadMutation.mutate(conversationId);
  };

  // Handle typing detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageText(value);

    if (!selectedConversationId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator if there's text
    if (value.trim().length > 0) {
      updateTypingMutation.mutate({
        conversationId: selectedConversationId,
        isTyping: true,
      });
      setIsTyping(true);

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingMutation.mutate({
          conversationId: selectedConversationId,
          isTyping: false,
        });
        setIsTyping(false);
      }, 2000);
    } else {
      // Stop typing immediately if input is empty
      updateTypingMutation.mutate({
        conversationId: selectedConversationId,
        isTyping: false,
      });
      setIsTyping(false);
    }
  };

  // Cleanup typing timeout on unmount or conversation change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing when conversation changes or component unmounts
      if (selectedConversationId && isTyping) {
        updateTypingMutation.mutate({
          conversationId: selectedConversationId,
          isTyping: false,
        });
      }
    };
  }, [selectedConversationId]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Column: Conversation List */}
        <Card className="w-80 flex flex-col shadow-sm border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-slate-900">Conversations</h2>
            <p className="text-xs text-slate-500 mt-1">
              {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
            </p>
            {/* Tabs */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setActiveTab('inbox')}
                className={cn(
                  'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === 'inbox'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                )}
              >
                Inbox
              </button>
              <button
                onClick={() => setActiveTab('taken')}
                className={cn(
                  'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === 'taken'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                )}
              >
                Taken
              </button>
              <button
                onClick={() => setActiveTab('complete')}
                className={cn(
                  'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === 'complete'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                )}
              >
                Complete
              </button>
            </div>
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
                  const isAssigned = conversation.assignedTo !== null && conversation.assignedTo !== undefined;
                  const isAssigning = assignConversationMutation.isPending;
                  const isUnassigning = unassignConversationMutation.isPending;

                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        'w-full hover:bg-gray-50 transition-colors',
                        isSelected && 'bg-indigo-50 border-l-4 border-indigo-600'
                      )}
                    >
                      <button
                        onClick={() => handleConversationSelect(conversation.id)}
                        className="w-full p-4 text-left"
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
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {conversation.platform === 'facebook' && (
                                  <FacebookIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                )}
                                {conversation.platform === 'chatwoot' && (
                                  <MessageSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                )}
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {conversation.externalUserName || `User ${conversation.externalUserId.slice(0, 8)}`}
                            </p>
                              </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {conversation.status === 'Open' && (
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              )}
                                {(() => {
                                  const releaseCount = conversation._count?.releases || 0;
                                  return releaseCount > 0 ? (
                                    <button
                                      onClick={(e) => handleShowReleaseHistory(conversation.id, e)}
                                      className="bg-orange-100 text-orange-700 text-xs font-medium rounded-full px-2 py-0.5 border border-orange-300 hover:bg-orange-200 transition-colors cursor-pointer"
                                      title="Click to view release history"
                                    >
                                      Released
                                    </button>
                                  ) : null;
                                })()}
                              {(() => {
                                const unreadCount = getUnreadCount(conversation);
                                return unreadCount > 0 ? (
                                  <span className="bg-indigo-600 text-white text-xs font-medium rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          </div>
                          {lastMessage && (
                            <p className="text-xs text-slate-500 truncate mb-1">
                              {lastMessage.content}
                            </p>
                          )}
                          {conversation.labels && conversation.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {conversation.labels.slice(0, 2).map((label) => (
                                <span
                                  key={label.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                                  title={label.source ? `${label.name} (${label.source})` : label.name}
                                >
                                  <Tag className="w-3 h-3" />
                                  {label.name}
                                </span>
                              ))}
                              {conversation.labels.length > 2 && (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                  +{conversation.labels.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                          {conversation.lastMessageAt && (
                            <p className="text-xs text-slate-400">
                              {formatTime(conversation.lastMessageAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                      {/* Action buttons */}
                      <div className="px-4 pb-3">
                        {activeTab === 'inbox' && !isAssigned && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              assignConversationMutation.mutate(conversation.id);
                            }}
                            disabled={isAssigning || isUnassigning}
                            size="sm"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            {isAssigning ? 'Taking...' : 'Take'}
                          </Button>
                        )}
                        {activeTab === 'taken' && isAssigned && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              unassignConversationMutation.mutate(conversation.id);
                            }}
                            disabled={isAssigning || isUnassigning}
                            size="sm"
                            variant="outline"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50"
                          >
                            {isUnassigning ? 'Releasing...' : 'Release'}
                          </Button>
                        )}
                      </div>
                    </div>
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {selectedConversation.externalUserName ? (
                        <span className="text-white text-sm font-medium">
                          {selectedConversation.externalUserName.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {selectedConversation.externalUserName || `User ${selectedConversation.externalUserId.slice(0, 8)}`}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
                            selectedConversation.status === 'Open'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {selectedConversation.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        {selectedConversation.platform === 'chatwoot' ? 'Chatwoot' : selectedConversation.platform === 'facebook' ? 'Facebook' : selectedConversation.platform}
                      </p>
                      {selectedConversation.labels && selectedConversation.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedConversation.labels.map((label) => (
                            <span
                              key={label.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                              title={label.source ? `${label.name} (${label.source})` : label.name}
                            >
                              <Tag className="w-3 h-3" />
                              {label.name}
                              {label.source && (
                                <span className="text-indigo-500">• {label.source}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowLabelModal(true);
                        setEditingLabel(null);
                        setLabelFormData({ name: '', source: '' });
                      }}
                      className="text-xs"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {selectedConversation.labels && selectedConversation.labels.length > 0 ? 'Manage Labels' : 'Add Label'}
                    </Button>
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
                    {selectedConversation.status === 'Open' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedConversationId) {
                            completeConversationMutation.mutate(selectedConversationId);
                          }
                        }}
                        disabled={completeConversationMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {completeConversationMutation.isPending ? 'Completing...' : 'Complete'}
                      </Button>
                    )}
                  </div>
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
                            'max-w-[70%] rounded-lg',
                            message.imageUrl ? 'p-0 overflow-hidden' : 'px-4 py-2',
                            isAgent
                              ? message.imageUrl ? 'bg-transparent' : 'bg-indigo-600 text-white'
                              : message.imageUrl ? 'bg-transparent' : 'bg-gray-100 text-slate-900'
                          )}
                        >
                          {message.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={getImageUrl(message.imageUrl)}
                                alt="Message attachment"
                                className="max-w-full max-h-[300px] rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  window.open(getImageUrl(message.imageUrl), '_blank');
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                                }}
                                loading="lazy"
                              />
                            </div>
                          )}
                          {message.content && (
                            <p className={cn('text-sm', message.imageUrl && 'px-4 py-2')}>{message.content}</p>
                          )}
                          <div
                            className={cn(
                              'flex items-center gap-2 mt-1',
                              message.imageUrl ? 'px-4 pb-2' : '',
                              isAgent ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <p
                              className={cn(
                                'text-xs',
                                isAgent ? 'text-indigo-100' : 'text-slate-500'
                              )}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                            {/* Read/Seen receipts */}
                            {isAgent && (
                              <span
                                className={cn(
                                  'text-xs',
                                  message.isSeen ? 'text-indigo-100' : 'text-indigo-200/70'
                                )}
                              >
                                {message.isSeen ? 'seen' : 'unseen'}
                              </span>
                            )}
                            {!isAgent && message.isRead && (
                              <CheckCheck className="w-3 h-3 text-slate-400" title="Read" />
                            )}
                          </div>
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
                {/* Typing Indicator */}
                {typingStatus?.isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 text-slate-900 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
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
                    <div className="space-y-3 mb-3">
                      {/* Tabs */}
                      <div className="flex gap-1 border-b border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setQuickReplyTab('default');
                            setSelectedCampaignId('');
                          }}
                          className={cn(
                            'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                            quickReplyTab === 'default'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          )}
                        >
                          Default Messages
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickReplyTab('campaign');
                            setSelectedCampaignId('');
                          }}
                          className={cn(
                            'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                            quickReplyTab === 'campaign'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          )}
                        >
                          Campaign Products
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickReplyTab('all');
                            setSelectedCampaignId('');
                          }}
                          className={cn(
                            'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                            quickReplyTab === 'all'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          )}
                        >
                          All Products
                        </button>
                      </div>

                      {/* Campaign Dropdown (only for Campaign Products tab) */}
                      {quickReplyTab === 'campaign' && (
                        <div>
                          <select
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select Campaign</option>
                            {activeCampaigns.map((campaign: any) => (
                              <option key={campaign.id} value={campaign.id}>
                                {campaign.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Default Messages Tab */}
                      {quickReplyTab === 'default' && (
                        <div className="flex flex-wrap gap-2">
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

                      {/* Campaign Products Tab */}
                      {quickReplyTab === 'campaign' && (
                        <div>
                          {!selectedCampaignId ? (
                            <div className="text-center py-4 text-xs text-slate-500">
                              Select a campaign to view product quick replies
                            </div>
                          ) : campaignProducts.length === 0 ? (
                            <div className="text-center py-4 text-xs text-slate-500">
                              No products assigned to this campaign
                            </div>
                          ) : (
                            <div className="space-y-4 max-h-64 overflow-y-auto">
                              {campaignProducts.map((product: any) => {
                                const quickReplies = product.quickReplies || [];
                                const attributes = quickReplies.filter((qr: any) => qr.type === 'attribute');
                                const salesMessages = quickReplies.filter((qr: any) => qr.type === 'sales');

                                return (
                                  <div key={product.id} className="p-3 border border-gray-200 rounded-md bg-white">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Package className="w-4 h-4 text-indigo-600" />
                                      <span className="text-sm font-semibold text-slate-900">{product.name}</span>
                                    </div>
                                    {attributes.length > 0 && (
                                      <div className="mb-2">
                                        <div className="text-xs font-medium text-slate-600 mb-1">Attributes:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {attributes.map((attr: any, idx: number) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => handleQuickReplyClick(`${attr.key || 'Attribute'}: ${attr.value}`)}
                                              className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                                            >
                                              {attr.key || 'Attribute'}: {attr.value}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {salesMessages.length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium text-slate-600 mb-1">Sales Messages:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {salesMessages.map((msg: any, idx: number) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => handleQuickReplyClick(msg.value)}
                                              className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                                            >
                                              {msg.value}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {attributes.length === 0 && salesMessages.length === 0 && (
                                      <div className="text-xs text-slate-400">No quick replies for this product</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* All Products Tab */}
                      {quickReplyTab === 'all' && (
                        <div>
                          {allProducts.length === 0 ? (
                            <div className="text-center py-4 text-xs text-slate-500">
                              No products available
                            </div>
                          ) : (
                            <div className="space-y-4 max-h-64 overflow-y-auto">
                              {allProducts.map((product: any) => {
                                const quickReplies = product.quickReplies || [];
                                const attributes = quickReplies.filter((qr: any) => qr.type === 'attribute');
                                const salesMessages = quickReplies.filter((qr: any) => qr.type === 'sales');

                                return (
                                  <div key={product.id} className="p-3 border border-gray-200 rounded-md bg-white">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Package className="w-4 h-4 text-indigo-600" />
                                      <span className="text-sm font-semibold text-slate-900">{product.name}</span>
                                    </div>
                                    {attributes.length > 0 && (
                                      <div className="mb-2">
                                        <div className="text-xs font-medium text-slate-600 mb-1">Attributes:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {attributes.map((attr: any, idx: number) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => handleQuickReplyClick(`${attr.key || 'Attribute'}: ${attr.value}`)}
                                              className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                                            >
                                              {attr.key || 'Attribute'}: {attr.value}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {salesMessages.length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium text-slate-600 mb-1">Sales Messages:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {salesMessages.map((msg: any, idx: number) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => handleQuickReplyClick(msg.value)}
                                              className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                                            >
                                              {msg.value}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {attributes.length === 0 && salesMessages.length === 0 && (
                                      <div className="text-xs text-slate-400">No quick replies for this product</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="px-4 pt-4 border-t border-gray-200">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-[200px] max-w-[300px] rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sendReplyMutation.isPending}
                      title="Attach image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={handleInputChange}
                      className="flex-1"
                      disabled={sendReplyMutation.isPending}
                    />
                    <Button
                      type="submit"
                      disabled={(!messageText.trim() && !selectedImage) || sendReplyMutation.isPending}
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
                  </div>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Create Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-lg max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>{getModalTitle()}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowLeadModal(false);
                    setLeadType(null);
                    setCurrentStep(1);
                    setSelectedProductId(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Progress Bar */}
              {leadType && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
                      const stepNum = step;
                      const isCompleted = stepNum < currentStep;
                      const isCurrent = stepNum === currentStep;
                      
                      return (
                        <div key={stepNum} className="flex items-center flex-1">
                          <div className="flex items-center justify-center flex-1">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                                isCompleted
                                  ? "bg-green-500 text-white"
                                  : isCurrent
                                  ? "bg-indigo-600 text-white ring-4 ring-indigo-200"
                                  : "bg-gray-200 text-gray-600"
                              )}
                            >
                              {isCompleted ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                stepNum
                              )}
                            </div>
                          </div>
                          {stepNum < totalSteps && (
                            <div
                              className={cn(
                                "h-1 flex-1 mx-2 transition-all duration-300",
                                isCompleted ? "bg-green-500" : "bg-gray-200"
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 ease-in-out"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {/* Step 1: Lead Type Selection */}
              {currentStep === 1 && !leadType && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">Select the type of lead you want to create:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sales Lead */}
                    <button
                      type="button"
                      onClick={() => {
                        setLeadType('sales');
                        setCurrentStep(2);
                      }}
                      className={cn(
                        "p-6 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-lg hover:scale-105",
                        "border-gray-200 hover:border-indigo-500 bg-white"
                      )}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                          <ShoppingCart className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Sales Lead</h3>
                        <p className="text-xs text-slate-600">Create a lead for product sales</p>
                      </div>
                    </button>

                    {/* Connection Lead */}
                    <button
                      type="button"
                      onClick={() => {
                        setLeadType('connection');
                        setCurrentStep(2);
                      }}
                      className={cn(
                        "p-6 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-lg hover:scale-105",
                        "border-gray-200 hover:border-indigo-500 bg-white"
                      )}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                          <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Connection Lead</h3>
                        <p className="text-xs text-slate-600">Create a lead for networking/partnerships</p>
                      </div>
                    </button>

                    {/* Research Lead */}
                    <button
                      type="button"
                      onClick={() => {
                        setLeadType('research');
                        setCurrentStep(2);
                      }}
                      className={cn(
                        "p-6 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-lg hover:scale-105",
                        "border-gray-200 hover:border-indigo-500 bg-white"
                      )}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                          <BarChart3 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Research Lead</h3>
                        <p className="text-xs text-slate-600">Create a lead for market research</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Sales Lead - Step 2: Product Selection */}
              {leadType === 'sales' && currentStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">Select a product for this sales lead:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {products.map((product: any) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedProductId(product.id)}
                        className={cn(
                          "p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md",
                          selectedProductId === product.id
                            ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                            : "border-gray-200 hover:border-indigo-300 bg-white"
                        )}
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-24 object-cover rounded-md mb-2"
                          />
                        )}
                        {!product.imageUrl && (
                          <div className="w-full h-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <h4 className="font-medium text-slate-900 text-sm mb-1 truncate">{product.name}</h4>
                        {product.price && (
                          <p className="text-xs text-slate-600">৳{parseFloat(product.price).toFixed(2)}</p>
                        )}
                        {selectedProductId === product.id && (
                          <div className="mt-2 flex items-center text-indigo-600 text-xs">
                            <Check className="w-4 h-4 mr-1" />
                            Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {products.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p>No products available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sales Lead - Step 3: Customer Information */}
              {leadType === 'sales' && currentStep === 3 && (
                <div className="space-y-4">
                <div>
                    <Label htmlFor="sales-customer-name">Customer Name *</Label>
                  <Input
                      id="sales-customer-name"
                      value={leadFormData.customerName}
                      onChange={(e) => setLeadFormData({ ...leadFormData, customerName: e.target.value })}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sales-phone">Phone *</Label>
                    <Input
                      id="sales-phone"
                      type="tel"
                      value={leadFormData.phone}
                      onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Sales Lead - Step 4: Lead Details */}
              {leadType === 'sales' && currentStep === 4 && (
                <form id="sales-lead-form" onSubmit={handleSubmitLead} className="space-y-4">
                  <div>
                    <Label htmlFor="sales-lead-title">Lead Title *</Label>
                    <Input
                      id="sales-lead-title"
                    value={leadFormData.title}
                    onChange={(e) => setLeadFormData({ ...leadFormData, title: e.target.value })}
                    placeholder="Enter lead title"
                    required
                  />
                </div>
                <div>
                    <Label htmlFor="sales-lead-category">Category *</Label>
                    <select
                      id="sales-lead-category"
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
                    <Label htmlFor="sales-lead-interest">Interest *</Label>
                    <select
                      id="sales-lead-interest"
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
                    <Label htmlFor="sales-lead-campaign">Select Campaign *</Label>
                    <select
                      id="sales-lead-campaign"
                      value={leadFormData.campaignId}
                      onChange={(e) => setLeadFormData({ ...leadFormData, campaignId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select campaign</option>
                      {campaigns.map((campaign: any) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name} - {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sales-lead-description">Description</Label>
                    <textarea
                      id="sales-lead-description"
                      value={leadFormData.description}
                      onChange={(e) => setLeadFormData({ ...leadFormData, description: e.target.value })}
                      placeholder="Enter lead description"
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {/* Product Pricing Summary for Sales Lead */}
                  {selectedProductId && (() => {
                    const selectedProduct = products.find((p: any) => p.id === selectedProductId);
                    if (selectedProduct) {
                      const purchasePrice = parseFloat(selectedProduct.purchasePrice) || 0;
                      const salePrice = parseFloat(selectedProduct.salePrice) || 0;
                      const profit = salePrice - purchasePrice;
                      return (
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                          <h4 className="font-semibold text-slate-900 text-sm mb-3">Product Pricing Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-600">Product:</span>
                              <p className="font-medium text-slate-900">{selectedProduct.name}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Purchase Price:</span>
                              <p className="font-medium text-slate-900">৳{purchasePrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Sale Price:</span>
                              <p className="font-medium text-slate-900">৳{salePrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Profit:</span>
                              <p className={cn(
                                "font-medium",
                                profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : "text-slate-600"
                              )}>
                                ৳{profit.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </form>
              )}

              {/* Connection Lead - Step 2: Basic Information */}
              {leadType === 'connection' && currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="connection-customer-name">Customer Name *</Label>
                  <Input
                      id="connection-customer-name"
                    value={leadFormData.customerName}
                    onChange={(e) => setLeadFormData({ ...leadFormData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                    <Label htmlFor="connection-phone">Phone *</Label>
                  <Input
                      id="connection-phone"
                    type="tel"
                    value={leadFormData.phone}
                    onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                    <Label htmlFor="connection-title">Lead Title *</Label>
                    <Input
                      id="connection-title"
                      value={leadFormData.title}
                      onChange={(e) => setLeadFormData({ ...leadFormData, title: e.target.value })}
                      placeholder="Enter lead title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="connection-description">Description</Label>
                    <textarea
                      id="connection-description"
                      value={leadFormData.description}
                      onChange={(e) => setLeadFormData({ ...leadFormData, description: e.target.value })}
                      placeholder="Enter lead description"
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Connection Lead - Step 3: Additional Details */}
              {leadType === 'connection' && currentStep === 3 && (
                <form id="connection-lead-form" onSubmit={handleSubmitLead} className="space-y-4">
                  <div>
                    <Label htmlFor="connection-category">Category *</Label>
                  <select
                      id="connection-category"
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
                    <Label htmlFor="connection-interest">Interest *</Label>
                  <select
                      id="connection-interest"
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
                    <Label htmlFor="connection-campaign">Select Campaign *</Label>
                  <select
                      id="connection-campaign"
                    value={leadFormData.campaignId}
                    onChange={(e) => setLeadFormData({ ...leadFormData, campaignId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                  >
                      <option value="">Select campaign</option>
                    {campaigns.map((campaign: any) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name} - {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                </form>
              )}

              {/* Research Lead - Step 2: Basic Information */}
              {leadType === 'research' && currentStep === 2 && (
                <div className="space-y-4">
                <div>
                    <Label htmlFor="research-customer-name">Customer Name *</Label>
                    <Input
                      id="research-customer-name"
                      value={leadFormData.customerName}
                      onChange={(e) => setLeadFormData({ ...leadFormData, customerName: e.target.value })}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="research-phone">Phone *</Label>
                    <Input
                      id="research-phone"
                      type="tel"
                      value={leadFormData.phone}
                      onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="research-title">Lead Title *</Label>
                    <Input
                      id="research-title"
                      value={leadFormData.title}
                      onChange={(e) => setLeadFormData({ ...leadFormData, title: e.target.value })}
                      placeholder="Enter lead title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="research-description">Description</Label>
                  <textarea
                      id="research-description"
                    value={leadFormData.description}
                    onChange={(e) => setLeadFormData({ ...leadFormData, description: e.target.value })}
                    placeholder="Enter lead description"
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                </div>
              )}

              {/* Research Lead - Step 3: Research Details */}
              {leadType === 'research' && currentStep === 3 && (
                <form id="research-lead-form" onSubmit={handleSubmitLead} className="space-y-4">
                <div>
                    <Label htmlFor="research-category">Category *</Label>
                    <select
                      id="research-category"
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
                    <Label htmlFor="research-interest">Interest *</Label>
                    <select
                      id="research-interest"
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
                    <Label htmlFor="research-campaign">Select Campaign *</Label>
                    <select
                      id="research-campaign"
                      value={leadFormData.campaignId}
                      onChange={(e) => setLeadFormData({ ...leadFormData, campaignId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select campaign</option>
                      {campaigns.map((campaign: any) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name} - {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </form>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2 justify-between mt-6 pt-4 border-t border-gray-200">
                <div>
                  {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                      onClick={() => {
                        if (currentStep === 2 && leadType) {
                          setLeadType(null);
                          setCurrentStep(1);
                          setSelectedProductId(null);
                        } else {
                          setCurrentStep(currentStep - 1);
                        }
                      }}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowLeadModal(false);
                      setLeadType(null);
                      setCurrentStep(1);
                      setSelectedProductId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  {currentStep === 1 && !leadType ? null : (
                    currentStep < totalSteps ? (
                  <Button
                        type="button"
                        onClick={() => {
                          if (leadType === 'sales' && currentStep === 2) {
                            if (!selectedProductId) {
                              alert('Please select a product');
                              return;
                            }
                          } else if (leadType === 'sales' && currentStep === 3) {
                            if (!leadFormData.customerName?.trim() || !leadFormData.phone?.trim()) {
                              alert('Please fill in all required fields');
                              return;
                            }
                          } else if ((leadType === 'connection' || leadType === 'research') && currentStep === 2) {
                            if (!leadFormData.customerName?.trim() || !leadFormData.phone?.trim() || !leadFormData.title?.trim()) {
                              alert('Please fill in all required fields');
                              return;
                            }
                          }
                          setCurrentStep(currentStep + 1);
                        }}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={(e) => {
                          if (leadType === 'sales' && !selectedProductId) {
                            alert('Please select a product');
                            return;
                          }
                          // Find and submit the appropriate form
                          const formId = leadType === 'sales' ? 'sales-lead-form' : 
                                        leadType === 'connection' ? 'connection-lead-form' : 
                                        'research-lead-form';
                          const form = document.getElementById(formId) as HTMLFormElement;
                          if (form) {
                            form.requestSubmit();
                          } else {
                            handleSubmitLead(e as any);
                          }
                        }}
                    disabled={createLeadMutation.isPending}
                  >
                    {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
                  </Button>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Release History Modal */}
      {showReleaseHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-lg max-h-[80vh] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Release History
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowReleaseHistoryModal(false);
                    setReleaseHistoryConversationId(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {releaseHistoryLoading ? (
                <div className="text-center py-8 text-slate-500">Loading release history...</div>
              ) : releaseHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No release history found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {releaseHistory.map((release) => {
                    const releaseDate = new Date(release.releasedAt);
                    const formattedDate = releaseDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    
                    return (
                      <div
                        key={release.id}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-slate-500" />
                              <span className="font-medium text-slate-900">
                                {release.employee.user.name || release.employee.user.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock className="w-4 h-4" />
                              <span>{formattedDate}</span>
                            </div>
                          </div>
                          <span className="bg-orange-100 text-orange-700 text-xs font-medium rounded-full px-2 py-1">
                            Released
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Label Management Modal */}
      {showLabelModal && selectedConversationId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-lg max-h-[80vh] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Manage Labels
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowLabelModal(false);
                    setEditingLabel(null);
                    setLabelFormData({ name: '', source: '' });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {/* Existing Labels */}
              {selectedConversation?.labels && selectedConversation.labels.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Existing Labels</h3>
                  <div className="space-y-2">
                    {selectedConversation.labels.map((label) => (
                      <div
                        key={label.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Tag className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium text-slate-900">{label.name}</span>
                          </div>
                          {label.source && (
                            <p className="text-xs text-slate-500 ml-6">Source: {label.source}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingLabel(label);
                              setLabelFormData({ name: label.name, source: label.source || '' });
                            }}
                            className="h-8 px-2"
                          >
                            <Edit className="w-4 h-4 text-indigo-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this label?')) {
                                deleteLabelMutation.mutate({
                                  conversationId: selectedConversationId,
                                  labelId: label.id,
                                });
                              }
                            }}
                            disabled={deleteLabelMutation.isPending}
                            className="h-8 px-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add/Edit Label Form */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-slate-900 mb-4">
                  {editingLabel ? 'Edit Label' : 'Add New Label'}
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!labelFormData.name.trim()) {
                      alert('Label name is required');
                      return;
                    }
                    if (editingLabel) {
                      updateLabelMutation.mutate({
                        conversationId: selectedConversationId,
                        labelId: editingLabel.id,
                        labelData: {
                          name: labelFormData.name.trim(),
                          source: labelFormData.source.trim() || null,
                        },
                      });
                    } else {
                      addLabelMutation.mutate({
                        conversationId: selectedConversationId,
                        labelData: {
                          name: labelFormData.name.trim(),
                          source: labelFormData.source.trim() || null,
                        },
                      });
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="label-name">Label Name *</Label>
                    <Input
                      id="label-name"
                      value={labelFormData.name}
                      onChange={(e) => setLabelFormData({ ...labelFormData, name: e.target.value })}
                      placeholder="e.g., Important, Follow-up, Customer"
                      maxLength={50}
                      required
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {labelFormData.name.length}/50 characters
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="label-source">Label Source (Optional)</Label>
                    <Input
                      id="label-source"
                      value={labelFormData.source}
                      onChange={(e) => setLabelFormData({ ...labelFormData, source: e.target.value })}
                      placeholder="e.g., Facebook Ad, Website, Referral"
                      maxLength={100}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {labelFormData.source.length}/100 characters
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={addLabelMutation.isPending || updateLabelMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {addLabelMutation.isPending || updateLabelMutation.isPending ? (
                        'Saving...'
                      ) : editingLabel ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Update Label
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Label
                        </>
                      )}
                    </Button>
                    {editingLabel && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingLabel(null);
                          setLabelFormData({ name: '', source: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          error={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
}

