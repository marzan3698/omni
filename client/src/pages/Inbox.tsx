import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi, type SocialConversation, type SocialMessage, type ConversationLabel } from '@/lib/social';
import { leadApi, leadCategoryApi, leadInterestApi, campaignApi, productApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, User, Bot, Target, X, Zap, Package, Image as ImageIcon, Check, CheckCheck, Clock, ShoppingCart, Users, Search, BarChart3, ChevronLeft, ChevronRight, Tag, Edit, Trash2, Plus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageUtils';
import { playNotificationSound } from '@/utils/notificationSound';
import { useAuth } from '@/contexts/AuthContext';
import { useInboxView } from '@/contexts/InboxViewContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ErrorAlert } from '@/components/ErrorAlert';
import { SuperAdminInbox } from '@/components/SuperAdminInbox';
import { EmployeeSelector } from '@/components/EmployeeSelector';

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

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
  const { user, hasPermission } = useAuth();
  const { setHideMainSidebar } = useInboxView();
  const [activeTab, setActiveTab] = useState<'inbox' | 'taken' | 'complete'>('taken');
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

  // Filter state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Closed'>('All');
  const [labelFilter, setLabelFilter] = useState<string | null>(null);

  // Multi-step lead form state
  const [leadType, setLeadType] = useState<'sales' | 'connection' | 'research' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedLeadEmployeeIds, setSelectedLeadEmployeeIds] = useState<number[]>([]);

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
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const lastSeenCustomerMessageIdRef = useRef<number | null>(null);
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

  // Assignment stats for Customer Care role (round-robin dashboard)
  const { data: stats } = useQuery({
    queryKey: ['assignment-stats'],
    queryFn: () => socialApi.getAssignmentStats(),
    refetchInterval: 10000,
    enabled: user?.roleName === 'Customer Care',
  });

  // Extract available labels from conversations
  const availableLabels = useMemo(() => {
    const labelSet = new Set<string>();
    conversations.forEach(conv => {
      conv.labels?.forEach(label => labelSet.add(label.name));
    });
    return Array.from(labelSet).sort();
  }, [conversations]);

  // Filter conversations based on status and label
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    // Filter by label
    if (labelFilter) {
      filtered = filtered.filter(conv =>
        conv.labels?.some(label => label.name === labelFilter)
      );
    }

    return filtered;
  }, [conversations, statusFilter, labelFilter]);

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
      const response = await leadCategoryApi.getAll();
      return response.data.data || [];
    },
    enabled: !!user?.companyId && showLeadModal,
  });

  // Fetch lead interests
  const { data: interestsResponse } = useQuery({
    queryKey: ['lead-interests'],
    queryFn: async () => {
      const response = await leadInterestApi.getAll();
      return response.data.data || [];
    },
    enabled: !!user?.companyId && showLeadModal,
  });

  // Fetch products for Sales Lead product selection
  const { data: products = [], isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ['products-for-lead', user?.companyId, showLeadModal],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await productApi.list(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId && showLeadModal,
    staleTime: 0,
  });

  // Refetch products when modal opens
  useEffect(() => {
    if (showLeadModal && user?.companyId) {
      refetchProducts();
    }
  }, [showLeadModal, user?.companyId, refetchProducts]);

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
      setSelectedLeadEmployeeIds([]);
      setLeadFormData({ title: '', description: '', value: '', assignedTo: '', customerName: '', phone: '', categoryId: '', interestId: '', campaignId: '' });
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

    // Set to sales lead directly - skip type selection
    setLeadType('sales');
    setCurrentStep(1); // Start at product selection (was step 2)
    setSelectedProductId(null);

    // Pre-fill form with conversation data
    const defaultTitle = selectedConversation.externalUserName
      ? `Lead from ${selectedConversation.externalUserName}`
      : `Lead from ${selectedConversation.platform}`;

    setLeadFormData({
      title: defaultTitle,
      description: '',
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

  // Calculate total steps based on lead type
  const getTotalSteps = () => {
    // Simplified: 2 steps - Product Selection → Customer Info
    return 2;
  };

  const totalSteps = getTotalSteps();

  // Get modal title based on current step and lead type
  const getModalTitle = () => {
    if (currentStep === 1) return 'প্রোডাক্ট সিলেক্ট করুন';
    if (currentStep === 2) return 'গ্রাহকের তথ্য';
    return 'Create Lead';
  };

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();

    // Only Name and Phone are required
    if (!leadFormData.customerName?.trim()) {
      alert('গ্রাহকের নাম আবশ্যক');
      return;
    }
    if (!leadFormData.phone?.trim()) {
      alert('মোবাইল নম্বর আবশ্যক');
      return;
    }

    // Product is required
    if (!selectedProductId) {
      alert('প্রোডাক্ট সিলেক্ট করুন');
      return;
    }

    // Get selected product
    const selectedProduct = products.find((p: any) => p.id === selectedProductId);

    // Auto-generate title
    const finalTitle = selectedProduct
      ? `${selectedProduct.name} - ${leadFormData.customerName}`
      : `Lead from ${leadFormData.customerName}`;

    // Parse optional fields (can be null/undefined)
    const categoryIdNum = leadFormData.categoryId && leadFormData.categoryId !== ''
      ? parseInt(leadFormData.categoryId, 10)
      : undefined;
    const interestIdNum = leadFormData.interestId && leadFormData.interestId !== ''
      ? parseInt(leadFormData.interestId, 10)
      : undefined;
    const campaignIdNum = leadFormData.campaignId && leadFormData.campaignId !== ''
      ? parseInt(leadFormData.campaignId, 10)
      : undefined;

    // Prepare lead data
    const leadData: any = {
      title: finalTitle,
      description: leadFormData.description || undefined,
      customerName: leadFormData.customerName,
      phone: leadFormData.phone,
      categoryId: categoryIdNum,
      interestId: interestIdNum,
      campaignId: campaignIdNum,
      assignedTo: selectedLeadEmployeeIds.length > 0 ? selectedLeadEmployeeIds : undefined,
    };

    // Add product pricing information
    if (selectedProduct) {
      const purchasePrice = parseFloat(selectedProduct.purchasePrice) || 0;
      const salePrice = parseFloat(selectedProduct.salePrice) || 0;
      const profit = salePrice - purchasePrice;

      leadData.productId = selectedProductId;
      leadData.purchasePrice = purchasePrice;
      leadData.salePrice = salePrice;
      leadData.profit = profit;
    }

    createLeadMutation.mutate(leadData, {
      onSuccess: () => {
        // Reset form state
        setShowLeadModal(false);
        setLeadType(null);
        setCurrentStep(1);
        setSelectedProductId(null);
        setSelectedLeadEmployeeIds([]);
        setLeadFormData({
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
      }
    });
  };

  // Hide main app sidebar when a chat is open; show when no chat selected. Inbox tabs/conversation list stay visible.
  useEffect(() => {
    setHideMainSidebar(!!selectedConversationId);
    return () => setHideMainSidebar(false);
  }, [selectedConversationId, setHideMainSidebar]);

  // Reset last-seen message when switching conversation
  useEffect(() => {
    lastSeenCustomerMessageIdRef.current = null;
  }, [selectedConversationId]);

  // Play notification sound when a new customer message arrives in the open conversation
  useEffect(() => {
    const messages = selectedConversation?.messages;
    if (!messages || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderType !== 'customer') return;
    const prevId = lastSeenCustomerMessageIdRef.current;
    if (prevId !== null && lastMsg.id !== prevId) {
      playNotificationSound();
    }
    lastSeenCustomerMessageIdRef.current = lastMsg.id;
  }, [selectedConversation?.messages, selectedConversationId]);

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

  // Close filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setShowFilterPanel(false);
      }
    };

    if (showFilterPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterPanel]);

  if (user?.roleName === 'SuperAdmin') {
    return <SuperAdminInbox />;
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-1 flex gap-4 overflow-hidden min-w-0">
        {/* Left Column: Conversation List - FIFA game style */}
        <div className="w-80 flex-shrink-0 flex flex-col game-panel rounded-xl overflow-hidden">
          {user?.roleName === 'Customer Care' && stats && (
            <div className="p-3 border-b border-amber-500/20 bg-slate-800/60">
              <div className="flex items-center justify-between text-sm flex-wrap gap-2 text-amber-100">
                <div className="flex gap-4">
                  <span>Total: <strong className="text-white">{stats.totalConversations}</strong></span>
                  <span className="text-emerald-400">WhatsApp: <strong>{stats.whatsappCount}</strong></span>
                  <span className="text-blue-400">Messenger: <strong>{stats.messengerCount}</strong></span>
                </div>
                <div className="flex gap-4">
                  <span>Assigned to you: <strong className="text-amber-300">{stats.assignedToMe}</strong></span>
                  <span className="text-slate-400">Reps: <strong>{stats.totalCustomerCareReps}</strong></span>
                </div>
              </div>
            </div>
          )}
          <div className="p-4 border-b border-amber-500/20">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-amber-100">Conversations</h2>
              <div className="relative" ref={filterPanelRef}>
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    showFilterPanel || statusFilter !== 'All' || labelFilter
                      ? "bg-amber-500/30 text-amber-200"
                      : "text-amber-200/70 hover:bg-amber-500/20 hover:text-amber-100"
                  )}
                  title="Filter conversations"
                >
                  <Filter className="h-4 w-4" />
                </button>
                {(statusFilter !== 'All' || labelFilter) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-game-badge-pulse"></span>
                )}

                {/* Filter Panel */}
                {showFilterPanel && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-lg shadow-xl z-50 p-4 game-panel border-amber-500/30">
                    <div className="space-y-4">
                      {/* Status Filter */}
                      <div>
                        <Label className="text-sm font-medium text-amber-200/90 mb-2 block">Status</Label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Open' | 'Closed')}
                          className="w-full rounded-lg border border-amber-500/20 bg-slate-800/60 px-3 py-2 text-sm text-amber-100 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        >
                          <option value="All">All</option>
                          <option value="Open">Open</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      {/* Label Filter */}
                      <div>
                        <Label className="text-sm font-medium text-amber-200/90 mb-2 block">Label</Label>
                        <select
                          value={labelFilter || ''}
                          onChange={(e) => setLabelFilter(e.target.value || null)}
                          className="w-full rounded-lg border border-amber-500/20 bg-slate-800/60 px-3 py-2 text-sm text-amber-100 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        >
                          <option value="">All Labels</option>
                          {availableLabels.length > 0 ? (
                            availableLabels.map((label) => (
                              <option key={label} value={label}>
                                {label}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>No labels available</option>
                          )}
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-amber-500/20">
                        <Button
                          onClick={() => {
                            setStatusFilter('All');
                            setLabelFilter(null);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={() => setShowFilterPanel(false)}
                          size="sm"
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-amber-200/80 mt-1">
              {filteredConversations.length} of {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
              {(statusFilter !== 'All' || labelFilter) && (
                <span className="ml-1 text-amber-400 font-medium">(filtered)</span>
              )}
            </p>
            {/* Tabs: Assigned, Complete, Inbox - game style */}
            <div className="flex gap-2 mt-3">
              {[
                { key: 'taken' as const, label: 'Assigned' },
                { key: 'complete' as const, label: 'Complete' },
                { key: 'inbox' as const, label: 'Inbox' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20 border border-amber-400/50'
                      : 'bg-slate-700/50 text-amber-100 hover:bg-amber-500/20 hover:text-white border border-amber-500/30'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-4 text-center text-amber-200/80">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-amber-200/70">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-amber-500/50" />
                <p>No conversations yet</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-amber-200/70">
                {activeTab === 'inbox' ? (
                  <>
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-amber-500/50" />
                    <p className="text-sm">No unassigned conversations.</p>
                    <p className="text-xs mt-1 text-amber-200/60">New chats are auto-assigned to live agents.</p>
                    {(statusFilter !== 'All' || labelFilter) && (
                      <Button
                        onClick={() => {
                          setStatusFilter('All');
                          setLabelFilter(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-3 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Filter className="w-12 h-12 mx-auto mb-2 text-amber-500/50" />
                    <p>No conversations match your filters</p>
                    <Button
                      onClick={() => {
                        setStatusFilter('All');
                        setLabelFilter(null);
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                    >
                      Clear Filters
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {filteredConversations.map((conversation, idx) => {
                  const lastMessage = getLastMessage(conversation);
                  const isSelected = selectedConversationId === conversation.id;
                  const isAssigned = conversation.assignedTo !== null && conversation.assignedTo !== undefined;
                  const isAssigning = assignConversationMutation.isPending;
                  const isUnassigning = unassignConversationMutation.isPending;

                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        'game-item-card rounded-lg overflow-hidden animate-game-item-reveal game-item-hover',
                        isSelected && 'game-item-selected',
                        'group'
                      )}
                      style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                    >
                      <button
                        onClick={() => handleConversationSelect(conversation.id)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-amber-500/50 bg-gradient-to-br from-amber-600 to-amber-800">
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
                                  <>
                                    <FacebookIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                    {conversation.chatwootInboxName ? (
                                      <span className="text-[10px] font-medium text-blue-300 bg-blue-500/20 px-1 rounded" title={conversation.chatwootInboxName}>
                                        {conversation.chatwootInboxName.length > 15 ? conversation.chatwootInboxName.slice(0, 15) + '…' : conversation.chatwootInboxName}
                                      </span>
                                    ) : (conversation.facebookPageName || conversation.facebookPageId) && (
                                      <span className="text-[10px] font-medium text-blue-300 bg-blue-500/20 px-1 rounded" title={conversation.facebookPageName || conversation.facebookPageId || undefined}>
                                        FB: {conversation.facebookPageName || conversation.facebookPageId || 'Page'}
                                      </span>
                                    )}
                                  </>
                                )}
                                {conversation.platform === 'whatsapp' && (
                                  <>
                                    <WhatsAppIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    {conversation.chatwootInboxName ? (
                                      <span className="text-[10px] font-medium text-emerald-300 bg-emerald-500/20 px-1 rounded" title={conversation.chatwootInboxName}>
                                        {conversation.chatwootInboxName.length > 15 ? conversation.chatwootInboxName.slice(0, 15) + '…' : conversation.chatwootInboxName}
                                      </span>
                                    ) : conversation.whatsappSlotId && (
                                      <span className="text-[10px] font-medium text-emerald-300 bg-emerald-500/20 px-1 rounded" title={`Slot ${conversation.whatsappSlotId}`}>
                                        S{conversation.whatsappSlotId}
                                      </span>
                                    )}
                                  </>
                                )}
                                <p className="text-sm font-medium text-amber-50 truncate">
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
                                    <span
                                      onClick={(e) => handleShowReleaseHistory(conversation.id, e)}
                                      className="bg-amber-500/30 text-amber-200 text-xs font-medium rounded-full px-2 py-0.5 border border-amber-500/40 hover:bg-amber-500/40 transition-colors cursor-pointer"
                                      title="Click to view release history"
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => e.key === 'Enter' && handleShowReleaseHistory(conversation.id, e as any)}
                                    >
                                      Released
                                    </span>
                                  ) : null;
                                })()}
                                {(() => {
                                  const unreadCount = getUnreadCount(conversation);
                                  return unreadCount > 0 ? (
                                    <span className="bg-amber-500 text-amber-950 text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center animate-game-badge-pulse">
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                            {lastMessage && (
                              <p className="text-xs text-slate-300 truncate mb-1">
                                {lastMessage.content}
                              </p>
                            )}
                            {conversation.labels && conversation.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {conversation.labels.slice(0, 2).map((label) => (
                                  <span
                                    key={label.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30"
                                    title={label.source ? `${label.name} (${label.source})` : label.name}
                                  >
                                    <Tag className="w-3 h-3" />
                                    {label.name}
                                  </span>
                                ))}
                                {conversation.labels.length > 2 && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-600/50 text-slate-300 border border-slate-500/50">
                                    +{conversation.labels.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                            {conversation.lastMessageAt && (
                              <p className="text-xs text-amber-500/80">
                                {formatTime(conversation.lastMessageAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                      {/* Action buttons */}
                      <div className="px-4 pb-3">
                        {activeTab === 'taken' && isAssigned && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              unassignConversationMutation.mutate(conversation.id);
                            }}
                            disabled={isAssigning || isUnassigning}
                            size="sm"
                            variant="outline"
                            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 bg-transparent"
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
        </div>

        {/* Right Column: Chat Window - game style */}
        <div className="flex-1 min-w-0 flex flex-col game-panel rounded-xl overflow-hidden">
          {!selectedConversationId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-amber-500/50" />
                <p className="text-amber-200/80">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-amber-200/80">Loading messages...</div>
            </div>
          ) : !selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-amber-200/80">Failed to load conversation</div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-amber-500/20 bg-slate-800/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-amber-500/50 bg-gradient-to-br from-amber-600 to-amber-800">
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
                        <h3 className="font-semibold text-amber-50 truncate">
                          {selectedConversation.externalUserName || `User ${selectedConversation.externalUserId.slice(0, 8)}`}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
                            selectedConversation.status === 'Open'
                              ? 'bg-emerald-500/30 text-emerald-300'
                              : 'bg-slate-600/50 text-slate-300'
                          )}
                        >
                          {selectedConversation.status}
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/80 mb-2 flex items-center gap-1.5">
                        {selectedConversation.platform === 'facebook' && <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />}
                        {selectedConversation.platform === 'whatsapp' && <WhatsAppIcon className="w-3.5 h-3.5 text-green-500" />}
                        {selectedConversation.platform === 'facebook' ? (selectedConversation.facebookPageName ? `FB: ${selectedConversation.facebookPageName}` : 'Facebook') : selectedConversation.platform === 'whatsapp' ? `WhatsApp${selectedConversation.whatsappSlotId ? ` (Slot ${selectedConversation.whatsappSlotId})` : ''}` : selectedConversation.platform}
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
                    {(hasPermission('can_manage_leads') || hasPermission('can_view_leads')) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateLead}
                        className="ml-4"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Create Lead
                      </Button>
                    )}
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
                              <span title="Read"><CheckCheck className="w-3 h-3 text-slate-400" /></span>
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
        </div>
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
                    setSelectedLeadEmployeeIds([]);
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
              {/* Step 1: Product Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">Select a product for this sales lead:</p>

                  {/* Loading State */}
                  {productsLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                      <p className="text-sm text-slate-500">প্রোডাক্ট লোড হচ্ছে...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {productsError && (
                    <div className="text-center py-8 text-red-500">
                      <p>প্রোডাক্ট লোড করতে সমস্যা হয়েছে</p>
                      <p className="text-xs">{(productsError as Error).message}</p>
                    </div>
                  )}

                  {/* Products Grid */}
                  {!productsLoading && !productsError && (
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
                          {product.salePrice && (
                            <p className="text-xs text-slate-600">৳{parseFloat(product.salePrice).toFixed(2)}</p>
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
                  )}

                  {/* Empty State - only show when not loading and no products */}
                  {!productsLoading && !productsError && products.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p>কোনো প্রোডাক্ট নেই</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Customer Information */}
              {currentStep === 2 && (
                <form id="lead-form" onSubmit={handleSubmitLead} className="space-y-4">
                  {/* Required Fields */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customer-name">গ্রাহকের নাম *</Label>
                      <Input
                        id="customer-name"
                        value={leadFormData.customerName}
                        onChange={(e) => setLeadFormData({ ...leadFormData, customerName: e.target.value })}
                        placeholder="গ্রাহকের নাম লিখুন"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-phone">মোবাইল নম্বর *</Label>
                      <Input
                        id="customer-phone"
                        type="tel"
                        value={leadFormData.phone}
                        onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                        placeholder="মোবাইল নম্বর লিখুন"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-slate-500 mb-3">অতিরিক্ত তথ্য (ঐচ্ছিক)</p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="lead-category">ক্যাটাগরি</Label>
                        <select
                          id="lead-category"
                          value={leadFormData.categoryId}
                          onChange={(e) => setLeadFormData({ ...leadFormData, categoryId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">ক্যাটাগরি সিলেক্ট করুন</option>
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="lead-interest">ইন্টারেস্ট</Label>
                        <select
                          id="lead-interest"
                          value={leadFormData.interestId}
                          onChange={(e) => setLeadFormData({ ...leadFormData, interestId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">ইন্টারেস্ট সিলেক্ট করুন</option>
                          {interests.map((int: any) => (
                            <option key={int.id} value={int.id}>
                              {int.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="lead-campaign">ক্যাম্পেইন</Label>
                        <select
                          id="lead-campaign"
                          value={leadFormData.campaignId}
                          onChange={(e) => setLeadFormData({ ...leadFormData, campaignId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">ক্যাম্পেইন সিলেক্ট করুন</option>
                          {campaigns.map((campaign: any) => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.name} - {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="lead-description">বিবরণ</Label>
                        <textarea
                          id="lead-description"
                          value={leadFormData.description}
                          onChange={(e) => setLeadFormData({ ...leadFormData, description: e.target.value })}
                          placeholder="বিবরণ লিখুন"
                          className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {user?.companyId && (
                        <div>
                          <Label>লিড ম্যানেজমেন্টের জন্য অ্যাসাইন করুন</Label>
                          <EmployeeSelector
                            companyId={user.companyId}
                            selectedEmployeeIds={selectedLeadEmployeeIds}
                            onSelectionChange={setSelectedLeadEmployeeIds}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Summary */}
                  {selectedProductId && (() => {
                    const selectedProduct = products.find((p: any) => p.id === selectedProductId);
                    if (selectedProduct) {
                      const salePrice = parseFloat(selectedProduct.salePrice) || 0;
                      return (
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <h4 className="font-semibold text-slate-900 text-sm mb-2">সিলেক্টেড প্রোডাক্ট</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{selectedProduct.name}</span>
                            <span className="text-sm font-medium text-slate-900">৳{salePrice.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </form>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2 justify-between mt-6 pt-4 border-t border-gray-200">
                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      পেছনে
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
                      setSelectedLeadEmployeeIds([]);
                    }}
                  >
                    বাতিল
                  </Button>
                  {currentStep === 1 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (!selectedProductId) {
                          alert('প্রোডাক্ট সিলেক্ট করুন');
                          return;
                        }
                        setCurrentStep(2);
                      }}
                    >
                      পরবর্তী
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={(e) => {
                        const form = document.getElementById('lead-form') as HTMLFormElement;
                        if (form) {
                          form.requestSubmit();
                        } else {
                          handleSubmitLead(e as any);
                        }
                      }}
                      disabled={createLeadMutation.isPending}
                    >
                      {createLeadMutation.isPending ? 'তৈরি হচ্ছে...' : 'লিড তৈরি করুন'}
                    </Button>
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

