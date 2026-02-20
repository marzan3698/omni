import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { leadApi, bookingApi, leadCategoryApi, leadInterestApi, campaignApi, productApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { useAuth } from '@/contexts/AuthContext';
import type { LeadMeeting, LeadMeetingStatus, LeadCall, LeadCallStatus } from '@/types';
import { EmployeeSelector } from '@/components/EmployeeSelector';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  Tag,
  Target,
  DollarSign,
  Package,
  TrendingUp,
  Building2,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingCart,
  Users,
  BarChart3,
  Facebook,
  CreditCard,
  Briefcase,
  Edit,
  Plus,
  UserPlus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const meetingSchema = z.object({
    assignedTo: z.number().int().positive('Assigned employee is required'),
    title: z.string().min(1, 'Meeting title is required'),
    description: z.string().optional(),
    meetingTime: z.string().min(1, 'Meeting time is required'),
    durationMinutes: z
      .number({ invalid_type_error: 'Duration is required' })
      .int()
      .positive('Duration must be positive'),
    platform: z.string().min(1, 'Platform is required'),
    meetingLink: z.string().min(1, 'Meeting link / location is required'),
    status: z.enum(['Scheduled', 'Completed', 'Canceled']).optional(),
  });

  type MeetingFormValues = z.infer<typeof meetingSchema>;

  const [editingMeeting, setEditingMeeting] = useState<LeadMeeting | null>(null);
  const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false);
  const [selectedMeetingEmployeeId, setSelectedMeetingEmployeeId] = useState<number[]>([]);

  const callSchema = z.object({
    title: z.string().optional(),
    phoneNumber: z.string().optional(),
    callTime: z.string().min(1, 'Call time is required'),
    durationMinutes: z.number().int().positive('Duration must be positive').optional(),
    assignedTo: z.number().int().positive('Assigned employee is required'),
    status: z.enum(['Scheduled', 'Completed', 'Canceled', 'NoAnswer', 'Busy', 'LeftVoicemail']).optional(),
  });

  type CallFormValues = z.infer<typeof callSchema>;

  const [editingCall, setEditingCall] = useState<LeadCall | null>(null);
  const [isCallFormOpen, setIsCallFormOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number[]>([]);
  const [editingCallNote, setEditingCallNote] = useState<{ callId: number; note: string } | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [leadAssignmentsSelectedIds, setLeadAssignmentsSelectedIds] = useState<number[]>([]);
  const [isTransferMonitoringModalOpen, setIsTransferMonitoringModalOpen] = useState(false);
  const [newLeadManagerUserId, setNewLeadManagerUserId] = useState<string>('');
  const [managerSearch, setManagerSearch] = useState('');

  // ─── Lead Edit Modal ─────────────────────────────────────────────────────
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [editLeadForm, setEditLeadForm] = useState<any>({});

  // Only fetch lookup data when the modal is open
  const { data: editCategories = [] } = useQuery({
    queryKey: ['lead-categories-edit'],
    queryFn: async () => (await leadCategoryApi.getAll()).data.data || [],
    enabled: isEditLeadModalOpen,
  });
  const { data: editInterests = [] } = useQuery({
    queryKey: ['lead-interests-edit'],
    queryFn: async () => (await leadInterestApi.getAll()).data.data || [],
    enabled: isEditLeadModalOpen,
  });
  const { data: editCampaigns = [] } = useQuery({
    queryKey: ['campaigns-edit', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      return (await campaignApi.getAll(user.companyId)).data.data || [];
    },
    enabled: isEditLeadModalOpen && !!user?.companyId,
  });
  const { data: editProducts = [] } = useQuery({
    queryKey: ['products-edit', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      return (await productApi.list(user.companyId)).data.data || [];
    },
    enabled: isEditLeadModalOpen && !!user?.companyId,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const companyId = user?.companyId;
      return leadApi.update(parseInt(id!), { ...data, companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setIsEditLeadModalOpen(false);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'লিড আপডেট করা সম্ভব হয়নি');
    },
  });

  const openEditLeadModal = () => {
    if (!lead) return;
    setEditLeadForm({
      title: lead.title || '',
      description: lead.description || '',
      source: lead.source || 'Inbox',
      customerName: lead.customerName || '',
      phone: lead.phone || '',
      value: lead.value != null ? String(lead.value) : '',
      categoryId: lead.categoryId != null ? String(lead.categoryId) : '',
      interestId: lead.interestId != null ? String(lead.interestId) : '',
      campaignId: lead.campaignId != null ? String(lead.campaignId) : '',
      productId: lead.productId != null ? String(lead.productId) : '',
      purchasePrice: lead.purchasePrice != null ? String(lead.purchasePrice) : '',
      salePrice: lead.salePrice != null ? String(lead.salePrice) : '',
      profit: lead.profit != null ? String(lead.profit) : '',
    });
    setIsEditLeadModalOpen(true);
  };

  const handleEditLeadField = (key: string, value: string) =>
    setEditLeadForm((prev: any) => ({ ...prev, [key]: value }));

  const handleAutoProfit = (form: any) => {
    const sp = parseFloat(form.salePrice);
    const pp = parseFloat(form.purchasePrice);
    if (!isNaN(sp) && !isNaN(pp)) {
      setEditLeadForm((prev: any) => ({ ...prev, profit: String(sp - pp) }));
    }
  };

  const handleSaveEditLead = () => {
    const payload: any = {};
    if (editLeadForm.title) payload.title = editLeadForm.title;
    if (editLeadForm.description !== undefined) payload.description = editLeadForm.description || null;
    if (editLeadForm.source) payload.source = editLeadForm.source;
    if (editLeadForm.customerName !== undefined) payload.customerName = editLeadForm.customerName;
    if (editLeadForm.phone !== undefined) payload.phone = editLeadForm.phone;
    payload.value = editLeadForm.value !== '' ? parseFloat(editLeadForm.value) : null;
    payload.categoryId = editLeadForm.categoryId !== '' ? parseInt(editLeadForm.categoryId) : null;
    payload.interestId = editLeadForm.interestId !== '' ? parseInt(editLeadForm.interestId) : null;
    payload.campaignId = editLeadForm.campaignId !== '' ? parseInt(editLeadForm.campaignId) : null;
    payload.productId = editLeadForm.productId !== '' ? parseInt(editLeadForm.productId) : null;
    payload.purchasePrice = editLeadForm.purchasePrice !== '' ? parseFloat(editLeadForm.purchasePrice) : null;
    payload.salePrice = editLeadForm.salePrice !== '' ? parseFloat(editLeadForm.salePrice) : null;
    payload.profit = editLeadForm.profit !== '' ? parseFloat(editLeadForm.profit) : null;
    updateLeadMutation.mutate(payload);
  };
  // ─────────────────────────────────────────────────────────────────────────

  // Lead status options with Bengali labels
  const statusOptions = [
    { value: 'New', label: 'নতুন (New)', color: 'bg-blue-100 text-blue-700' },
    { value: 'Contacted', label: 'যোগাযোগ করা হয়েছে (Contacted)', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'Qualified', label: 'যোগ্য (Qualified)', color: 'bg-purple-100 text-purple-700' },
    { value: 'Negotiation', label: 'আলোচনা চলছে (Negotiation)', color: 'bg-orange-100 text-orange-700' },
    { value: 'Won', label: 'সম্পন্ন (Complete)', color: 'bg-green-100 text-green-700' },
    { value: 'Lost', label: 'ব্যর্থ (Failed)', color: 'bg-red-100 text-red-700' },
  ];

  const convertSchema = z.object({
    name: z.string().min(1, 'Client name is required').optional(),
    address: z.string().optional(),
    email: z.string().min(1, 'ইমেইল আবশ্যক (লগইনের জন্য)').email('সঠিক ইমেইল দিন'),
    phone: z.string().optional(),
    password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর'),
    confirmPassword: z.string().min(1, 'পাসওয়ার্ড নিশ্চিত করুন'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'পাসওয়ার্ড মিলছে না',
    path: ['confirmPassword'],
  });

  type ConvertFormValues = z.infer<typeof convertSchema>;

  const {
    register: registerConvert,
    handleSubmit: handleConvertSubmit,
    reset: resetConvert,
    formState: { errors: convertErrors, isSubmitting: isConvertSubmitting },
  } = useForm<ConvertFormValues>({
    resolver: zodResolver(convertSchema),
    defaultValues: {
      name: '',
      address: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    register: registerCall,
    handleSubmit: handleCallSubmit,
    reset: resetCall,
    formState: { errors: callErrors, isSubmitting: isCallSubmitting },
    setValue: setCallValue,
    watch: watchCall,
  } = useForm<CallFormValues>({
    resolver: zodResolver(callSchema),
    defaultValues: {
      title: '',
      phoneNumber: '',
      callTime: '',
      durationMinutes: undefined,
      assignedTo: 0,
      status: 'Scheduled',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      assignedTo: 0,
      title: '',
      description: '',
      meetingTime: '',
      durationMinutes: 30,
      platform: 'Google meet',
      meetingLink: '',
      status: 'Scheduled',
    },
  });

  const meetingTime = watch('meetingTime');
  const meetingDurationMinutes = watch('durationMinutes');
  const callTime = watchCall('callTime');
  const callDurationMinutes = watchCall('durationMinutes');

  const callDurationForAvailability = callDurationMinutes && callDurationMinutes >= 1 ? callDurationMinutes : 15;
  const meetingStartValid = meetingTime && !Number.isNaN(new Date(meetingTime).getTime());
  const callStartValid = callTime && !Number.isNaN(new Date(callTime).getTime());

  const { data: callAvailabilityData } = useQuery({
    queryKey: ['booking-availability', user?.companyId, callTime, callDurationForAvailability],
    queryFn: async () => {
      if (!user?.companyId || !callStartValid) return { busyEmployeeIds: [] as number[] };
      const res = await bookingApi.getAvailability(
        user.companyId,
        new Date(callTime).toISOString(),
        callDurationForAvailability,
        editingCall ? { excludeCallId: editingCall.id } : undefined
      );
      return (res.data.data as { busyEmployeeIds: number[] }) ?? { busyEmployeeIds: [] };
    },
    enabled: isCallFormOpen && !!user?.companyId && !!callStartValid,
  });

  const { data: meetingAvailabilityData } = useQuery({
    queryKey: ['booking-availability', user?.companyId, meetingTime, meetingDurationMinutes],
    queryFn: async () => {
      if (!user?.companyId || !meetingTime || !meetingStartValid || !(meetingDurationMinutes >= 1)) {
        return { busyEmployeeIds: [] as number[] };
      }
      const res = await bookingApi.getAvailability(
        user.companyId,
        new Date(meetingTime).toISOString(),
        Number(meetingDurationMinutes),
        editingMeeting ? { excludeMeetingId: editingMeeting.id } : undefined
      );
      return (res.data.data as { busyEmployeeIds: number[] }) ?? { busyEmployeeIds: [] };
    },
    enabled: isMeetingFormOpen && !!user?.companyId && !!meetingStartValid && !!(meetingDurationMinutes >= 1),
  });

  const busyEmployeeIdsCall = callAvailabilityData?.busyEmployeeIds ?? [];
  const busyEmployeeIdsMeeting = meetingAvailabilityData?.busyEmployeeIds ?? [];

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id, user?.companyId],
    queryFn: async () => {
      if (!id || !user?.companyId) throw new Error('Invalid parameters');
      const response = await leadApi.getById(parseInt(id), user.companyId);
      return response.data.data;
    },
    enabled: !!id && !!user?.companyId,
  });

  const isLeadManagerOrSuperAdmin = user?.roleName === 'Lead Manager' || user?.roleName === 'SuperAdmin';
  const isMonitoringAllowed =
    isLeadManagerOrSuperAdmin &&
    (user?.roleName === 'SuperAdmin' ||
      !lead?.leadMonitoringUserId ||
      lead?.leadMonitoringUserId === user?.id);

  const { data: leadManagers = [] } = useQuery({
    queryKey: ['lead-managers', user?.companyId],
    queryFn: async () => {
      const response = await leadApi.getLeadManagers();
      return (response.data.data as Array<{ id: string; name?: string | null; email: string }>) ?? [];
    },
    enabled: isTransferMonitoringModalOpen && isLeadManagerOrSuperAdmin,
  });

  const transferMonitoringMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Invalid parameters');
      if (!newLeadManagerUserId) throw new Error('Please select a Lead Manager');
      const response = await leadApi.transferMonitoring(parseInt(id), newLeadManagerUserId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id, user?.companyId] });
      setIsTransferMonitoringModalOpen(false);
      setNewLeadManagerUserId('');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to transfer monitoring responsibility');
    },
  });

  const { data: meetings = [], isLoading: isLoadingMeetings } = useQuery<LeadMeeting[]>({
    queryKey: ['lead-meetings', id, user?.companyId],
    queryFn: async () => {
      if (!id || !user?.companyId) return [];
      const response = await leadApi.getMeetings(parseInt(id), user.companyId);
      return (response.data.data as LeadMeeting[]) || [];
    },
    enabled: !!id && !!user?.companyId,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (values: MeetingFormValues) => {
      if (!id || !user?.companyId || !values.assignedTo) {
        throw new Error('Invalid parameters');
      }

      const payload = {
        ...values,
        assignedTo: values.assignedTo,
        meetingTime: new Date(values.meetingTime),
        durationMinutes: Number(values.durationMinutes),
      };

      const response = await leadApi.createMeeting(parseInt(id), payload, user.companyId);
      return response.data.data as LeadMeeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-meetings', id, user?.companyId] });
      setIsMeetingFormOpen(false);
      setEditingMeeting(null);
      setSelectedMeetingEmployeeId([]);
      reset();
    },
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async (values: MeetingFormValues) => {
      if (!id || !user?.companyId || !editingMeeting || !values.assignedTo) {
        throw new Error('Invalid parameters');
      }

      const payload = {
        ...values,
        assignedTo: values.assignedTo,
        meetingTime: new Date(values.meetingTime),
        durationMinutes: Number(values.durationMinutes),
      };

      const response = await leadApi.updateMeeting(
        parseInt(id),
        editingMeeting.id,
        payload,
        user.companyId
      );
      return response.data.data as LeadMeeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-meetings', id, user?.companyId] });
      setIsMeetingFormOpen(false);
      setEditingMeeting(null);
      setSelectedMeetingEmployeeId([]);
      reset();
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      if (!id || !user?.companyId) {
        throw new Error('Invalid parameters');
      }
      const response = await leadApi.deleteMeeting(parseInt(id), meetingId, user.companyId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-meetings', id, user?.companyId] });
    },
  });

  const openCreateMeetingForm = () => {
    setEditingMeeting(null);
    setSelectedMeetingEmployeeId([]);
    reset({
      assignedTo: 0,
      title: '',
      description: '',
      meetingTime: '',
      durationMinutes: 30,
      platform: 'Google meet',
      meetingLink: '',
      status: 'Scheduled',
    });
    setIsMeetingFormOpen(true);
  };

  const openEditMeetingForm = (meeting: LeadMeeting) => {
    setEditingMeeting(meeting);
    setSelectedMeetingEmployeeId(meeting.assignedTo ? [meeting.assignedTo] : []);
    reset({
      assignedTo: meeting.assignedTo ?? 0,
      title: meeting.title,
      description: meeting.description || '',
      meetingTime: new Date(meeting.meetingTime).toISOString().slice(0, 16),
      durationMinutes: meeting.durationMinutes,
      platform: meeting.platform,
      meetingLink: meeting.meetingLink,
      status: meeting.status as 'Scheduled' | 'Completed' | 'Canceled',
    });
    setIsMeetingFormOpen(true);
  };

  useEffect(() => {
    if (selectedMeetingEmployeeId.length > 0) {
      setValue('assignedTo', selectedMeetingEmployeeId[0]);
    } else {
      setValue('assignedTo', 0);
    }
  }, [selectedMeetingEmployeeId, setValue]);

  const handleMeetingSubmit = (values: MeetingFormValues) => {
    if (editingMeeting) {
      return updateMeetingMutation.mutateAsync(values);
    }
    return createMeetingMutation.mutateAsync(values);
  };

  // Update call form phone number when lead loads (only if form is not open)
  useEffect(() => {
    if (lead?.phone && !isCallFormOpen) {
      setCallValue('phoneNumber', lead.phone);
    }
  }, [lead?.phone, isCallFormOpen, setCallValue]);

  // Sync selectedEmployeeId with form's assignedTo field
  useEffect(() => {
    if (selectedEmployeeId.length > 0) {
      setCallValue('assignedTo', selectedEmployeeId[0]);
    } else {
      setCallValue('assignedTo', 0);
    }
  }, [selectedEmployeeId, setCallValue]);

  // Call queries and mutations
  const { data: calls = [], isLoading: isLoadingCalls } = useQuery<LeadCall[]>({
    queryKey: ['lead-calls', id, user?.companyId],
    queryFn: async () => {
      if (!id || !user?.companyId) return [];
      const response = await leadApi.getCalls(parseInt(id), user.companyId);
      return (response.data.data as LeadCall[]) || [];
    },
    enabled: !!id && !!user?.companyId,
  });

  const createCallMutation = useMutation({
    mutationFn: async (values: CallFormValues) => {
      if (!id || !user?.companyId || selectedEmployeeId.length === 0) {
        throw new Error('Invalid parameters');
      }

      const payload = {
        ...values,
        callTime: new Date(values.callTime),
        assignedTo: selectedEmployeeId[0],
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
      };

      const response = await leadApi.createCall(parseInt(id), payload, user.companyId);
      return response.data.data as LeadCall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-calls', id, user?.companyId] });
      setIsCallFormOpen(false);
      setEditingCall(null);
      setSelectedEmployeeId([]);
      resetCall();
    },
  });

  const updateCallMutation = useMutation({
    mutationFn: async (values: CallFormValues) => {
      if (!id || !user?.companyId || !editingCall) {
        throw new Error('Invalid parameters');
      }

      const payload = {
        ...values,
        callTime: new Date(values.callTime),
        assignedTo: selectedEmployeeId.length > 0 ? selectedEmployeeId[0] : editingCall.assignedTo,
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
      };

      const response = await leadApi.updateCall(
        parseInt(id),
        editingCall.id,
        payload,
        user.companyId
      );
      return response.data.data as LeadCall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-calls', id, user?.companyId] });
      setIsCallFormOpen(false);
      setEditingCall(null);
      setSelectedEmployeeId([]);
      resetCall();
    },
  });

  const deleteCallMutation = useMutation({
    mutationFn: async (callId: number) => {
      if (!id || !user?.companyId) {
        throw new Error('Invalid parameters');
      }
      const response = await leadApi.deleteCall(parseInt(id), callId, user.companyId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-calls', id, user?.companyId] });
    },
  });

  const addCallNoteMutation = useMutation({
    mutationFn: async ({ callId, note }: { callId: number; note: string }) => {
      if (!id || !user?.companyId) {
        throw new Error('Invalid parameters');
      }
      const response = await leadApi.addCallNote(parseInt(id), callId, note, user.companyId);
      return response.data.data as LeadCall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-calls', id, user?.companyId] });
      setEditingCallNote(null);
    },
  });

  // Convert lead to client mutation
  const convertToClientMutation = useMutation({
    mutationFn: async (values: ConvertFormValues) => {
      if (!id || !user?.companyId) {
        throw new Error('Invalid parameters');
      }

      const clientData: any = {
        password: values.password,
      };
      if (values.name) clientData.name = values.name;
      if (values.address) clientData.address = values.address;

      const contactInfo: any = {};
      if (values.email) contactInfo.email = values.email;
      if (values.phone) contactInfo.phone = values.phone;
      if (Object.keys(contactInfo).length > 0) {
        clientData.contactInfo = contactInfo;
      }

      const response = await leadApi.convert(parseInt(id), user.companyId, clientData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id, user?.companyId] });
      queryClient.invalidateQueries({ queryKey: ['my-balance-points'] });
      setIsConvertModalOpen(false);
      resetConvert();
      alert(
        'ক্লায়েন্ট রিকোয়েস্ট তৈরি হয়েছে। ফাইন্যান্স অ্যাপ্রুভের পর ক্লায়েন্ট লগইন করতে পারবে।\nClient created. Pending approval. Client can login after Finance approves.'
      );
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to convert lead to client');
    },
  });

  // Update lead status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!id || !user?.companyId) {
        throw new Error('Invalid parameters');
      }
      const response = await leadApi.updateStatus(parseInt(id), newStatus, user.companyId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id, user?.companyId] });
      queryClient.invalidateQueries({ queryKey: ['my-balance-points'] }); // Refresh balance/points
      setIsStatusModalOpen(false);
      setSelectedStatus('');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে');
    },
  });

  const assignUsersMutation = useMutation({
    mutationFn: async (employeeIds: number[]) => {
      if (!id || !user?.companyId) throw new Error('Invalid parameters');
      const response = await leadApi.assignUsers(parseInt(id), employeeIds, user.companyId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id, user?.companyId] });
      setLeadAssignmentsSelectedIds([]);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'অ্যাসাইন যোগ করতে ব্যর্থ');
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      if (!id || !user?.companyId) throw new Error('Invalid parameters');
      const response = await leadApi.removeAssignment(parseInt(id), employeeId, user.companyId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id, user?.companyId] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'অ্যাসাইন সরাতে ব্যর্থ');
    },
  });

  const openStatusModal = () => {
    setSelectedStatus(lead?.status || 'New');
    setIsStatusModalOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedStatus && selectedStatus !== lead?.status) {
      updateStatusMutation.mutate(selectedStatus);
    } else {
      setIsStatusModalOpen(false);
    }
  };

  const openConvertModal = () => {
    resetConvert({
      name: lead?.customerName || lead?.title || '',
      address: '',
      email: '',
      phone: lead?.phone || '',
      password: '',
      confirmPassword: '',
    });
    setIsConvertModalOpen(true);
  };

  const onConvertSubmit = (values: ConvertFormValues) => {
    convertToClientMutation.mutate(values);
  };

  const openCreateCallForm = () => {
    setEditingCall(null);
    setSelectedEmployeeId([]);
    resetCall({
      title: '',
      phoneNumber: lead?.phone || '',
      callTime: '',
      durationMinutes: undefined,
      assignedTo: 0,
      status: 'Scheduled',
    });
    setIsCallFormOpen(true);
  };

  const openEditCallForm = (call: LeadCall) => {
    setEditingCall(call);
    setSelectedEmployeeId([call.assignedTo]);
    resetCall({
      title: call.title || '',
      phoneNumber: call.phoneNumber || lead?.phone || '',
      callTime: new Date(call.callTime).toISOString().slice(0, 16),
      durationMinutes: call.durationMinutes || undefined,
      assignedTo: call.assignedTo,
      status: call.status as LeadCallStatus,
    });
    setIsCallFormOpen(true);
  };

  const onCallSubmit = (values: CallFormValues) => {
    // Ensure assignedTo is set from selectedEmployeeId if not already set
    if (selectedEmployeeId.length > 0 && (!values.assignedTo || values.assignedTo === 0)) {
      values.assignedTo = selectedEmployeeId[0];
    }

    if (!values.assignedTo || values.assignedTo === 0) {
      alert('Please select an employee');
      return;
    }

    if (editingCall) {
      return updateCallMutation.mutateAsync(values);
    }
    return createCallMutation.mutateAsync(values);
  };

  const getCallStatusColor = (status: LeadCallStatus) => {
    switch (status) {
      case 'Scheduled': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
      case 'Completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Canceled': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'NoAnswer': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
      case 'Busy': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'LeftVoicemail': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default: return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
    }
  };

  const btnOutline =
    'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <GamePanel className="p-8 max-w-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-amber-500/50 border-t-amber-400 mx-auto" />
            <p className="mt-4 text-amber-200/80">Loading lead details...</p>
          </div>
        </GamePanel>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <GamePanel className="w-full max-w-md p-8">
          <div className="text-center">
            <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-amber-100 mb-2">Lead Not Found</h3>
            <p className="text-amber-200/70 mb-6">
              {error ? 'Failed to load lead details' : 'The lead you are looking for does not exist'}
            </p>
            <Button onClick={() => navigate('/leads')} className={btnOutline}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </div>
        </GamePanel>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Won': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Lost': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'New': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Contacted': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
      case 'Qualified': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Negotiation': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      default: return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Won': return <CheckCircle className="w-4 h-4" />;
      case 'Lost': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Inbox': return <MessageSquare className="w-4 h-4" />;
      case 'Website': return <FileText className="w-4 h-4" />;
      case 'SocialMedia': return <Facebook className="w-4 h-4" />;
      case 'Referral': return <Users className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Phone': return <Phone className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMeetingDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Futuristic Header */}
      <GamePanel className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/leads')}
              className={cn(
                'p-2 rounded-lg border border-amber-500/40 text-amber-200',
                'hover:bg-amber-500/20 hover:border-amber-500/60 transition-all'
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-amber-100">{lead.title}</h1>
                <span className="px-2 py-1 text-xs font-mono text-amber-400/80 bg-slate-800/80 rounded border border-amber-500/20">
                  #{lead.id}
                </span>
              </div>
              <p className="text-amber-200/70 mt-1 text-sm">Lead details & activity</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isMonitoringAllowed ? (
              <button
                onClick={openStatusModal}
                className={cn(
                  'px-4 py-2 rounded-lg border flex items-center gap-2 font-medium text-sm cursor-pointer hover:opacity-90 transition-all',
                  getStatusColor(lead.status)
                )}
                title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
              >
                {getStatusIcon(lead.status)}
                {lead.status}
                <Edit className="w-3 h-3 ml-1 opacity-80" />
              </button>
            ) : (
              <span
                className={cn(
                  'px-4 py-2 rounded-lg border flex items-center gap-2 font-medium text-sm',
                  getStatusColor(lead.status)
                )}
                title={
                  isLeadManagerOrSuperAdmin && lead?.leadMonitoringUser
                    ? `Monitoring Incharge: ${lead.leadMonitoringUser.name || lead.leadMonitoringUser.email}`
                    : undefined
                }
              >
                {getStatusIcon(lead.status)}
                {lead.status}
              </span>
            )}
            {lead.convertedToClientId ? (
              <span className="px-4 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 font-medium text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Already added as client
              </span>
            ) : (
              lead.status === 'Won' && isMonitoringAllowed && (
                <Button onClick={openConvertModal} className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Convert to Client
                </Button>
              )
            )}
            {isLeadManagerOrSuperAdmin && (user?.roleName === 'SuperAdmin' || lead?.leadMonitoringUserId === user?.id) && (
              <Button
                onClick={() => setIsTransferMonitoringModalOpen(true)}
                disabled={!lead?.leadMonitoringUserId}
                title={!lead?.leadMonitoringUserId ? 'Monitoring incharge is not assigned yet' : 'Transfer monitoring responsibility'}
                className={btnOutline}
              >
                <Users className="w-4 h-4 mr-2" />
                Transfer Monitoring
              </Button>
            )}
            {/* Edit Lead – visible only to SuperAdmin or users with can_edit_leads */}
            {(user?.roleName === 'SuperAdmin' || hasPermission?.('can_edit_leads')) && (
              <Button onClick={openEditLeadModal} className={btnOutline}>
                <Edit className="w-4 h-4 mr-2" />
                লিড এডিট করুন
              </Button>
            )}
          </div>
        </div>
      </GamePanel>

      {/* Stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GameCard index={0} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Meetings</p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{meetings.length}</p>
            </div>
            <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10">
              <Calendar className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={1} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Calls</p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{calls.length}</p>
            </div>
            <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10">
              <Phone className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={2} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Est. Value</p>
              <p className="text-xl font-bold text-emerald-300 mt-1">{formatCurrency(lead.value)}</p>
            </div>
            <div className="p-3 rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </GameCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <GamePanel>
            <div className="p-6 space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                <FileText className="w-5 h-5 text-amber-400" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Title</label>
                  <p className="mt-1 text-amber-100 font-medium">{lead.title}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Source</label>
                  <p className="mt-1 flex items-center gap-2 text-amber-100">
                    {getSourceIcon(lead.source)}
                    <span>{lead.source}</span>
                  </p>
                </div>
                {lead.description && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Description</label>
                    <p className="mt-1 text-amber-200/90 whitespace-pre-wrap">{lead.description}</p>
                  </div>
                )}
              </div>
            </div>
          </GamePanel>

          {/* Monitoring */}
          <GamePanel>
            <div className="p-6 space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                <Users className="w-5 h-5 text-amber-400" />
                Monitoring
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-amber-400/80 mt-0.5" />
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Lead Monitoring Incharge</label>
                    <p className="mt-1 text-amber-100 font-medium">
                      {lead.leadMonitoringUser
                        ? (lead.leadMonitoringUser.name || lead.leadMonitoringUser.email)
                        : 'Not assigned yet'}
                    </p>
                    {lead.leadMonitoringUser?.email && lead.leadMonitoringUser?.name && (
                      <p className="text-xs text-amber-200/60">{lead.leadMonitoringUser.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-amber-400/80 mt-0.5" />
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Finance Monitoring</label>
                    <p className="mt-1 text-amber-100 font-medium">
                      {lead.clientApprovalRequest?.status === 'Approved'
                        ? (lead.clientApprovalRequest.approvedByUser?.name ||
                          lead.clientApprovalRequest.approvedByUser?.email ||
                          'Approved')
                        : lead.clientApprovalRequest?.status === 'Pending'
                          ? 'Pending approval'
                          : '—'}
                    </p>
                    {lead.clientApprovalRequest?.status === 'Approved' && lead.clientApprovalRequest.approvedAt && (
                      <p className="text-xs text-amber-200/60">
                        Approved at: {new Date(lead.clientApprovalRequest.approvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GamePanel>

          {/* Customer Information */}
          <GamePanel>
            <div className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
                <User className="w-5 h-5 text-amber-400" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.customerName && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-amber-400/80 mt-0.5" />
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Customer Name</label>
                      <p className="mt-1 text-amber-100 font-medium">{lead.customerName}</p>
                    </div>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-amber-400/80 mt-0.5" />
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Phone</label>
                      <p className="mt-1 text-amber-100 font-medium">{lead.phone}</p>
                    </div>
                  </div>
                )}
                {lead.conversation && (
                  <div className="md:col-span-2 flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-amber-400/80 mt-0.5" />
                    <div className="flex-1">
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Source Conversation</label>
                      <p className="mt-1 text-amber-100">
                        {lead.conversation.platform === 'facebook' ? 'Facebook' : 'Chatwoot'} -
                        {lead.conversation.externalUserName || lead.conversation.externalUserId}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GamePanel>

          {/* Product Information (for Sales Leads) */}
          {lead.product && (
            <GamePanel>
              <div className="p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
                  <ShoppingCart className="w-5 h-5 text-amber-400" />
                  Product Information
                </h3>
                <div className="flex gap-6">
                  {lead.product.imageUrl && (
                    <img
                      src={lead.product.imageUrl}
                      alt={lead.product.name}
                      className="w-24 h-24 object-cover rounded-lg border border-amber-500/20"
                    />
                  )}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Product Name</label>
                      <p className="mt-1 text-amber-100 font-medium text-lg">{lead.product.name}</p>
                      {lead.product.description && (
                        <p className="mt-2 text-sm text-amber-200/80">{lead.product.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-amber-500/20">
                      <div>
                        <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Purchase Price</label>
                        <p className="mt-1 text-amber-100 font-medium">
                          {formatCurrency(lead.purchasePrice || lead.product.purchasePrice)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Sale Price</label>
                        <p className="mt-1 text-amber-100 font-medium">
                          {formatCurrency(lead.salePrice || lead.product.salePrice)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Profit</label>
                        <p className={cn(
                          "mt-1 font-medium",
                          lead.profit && Number(lead.profit) > 0
                            ? "text-emerald-400"
                            : lead.profit && Number(lead.profit) < 0
                              ? "text-red-400"
                              : "text-amber-100"
                        )}>
                          {formatCurrency(lead.profit)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Currency</label>
                        <p className="mt-1 text-amber-100 font-medium">{lead.product.currency || 'BDT'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GamePanel>
          )}

          {/* Campaign Information */}
          {lead.campaign && (
            <GamePanel>
              <div className="p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
                  <Target className="w-5 h-5 text-amber-400" />
                  Campaign Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Campaign Name</label>
                    <p className="mt-1 text-amber-100 font-medium">{lead.campaign.name}</p>
                  </div>
                  {lead.campaign.description && (
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Description</label>
                      <p className="mt-1 text-amber-200/80">{lead.campaign.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-amber-500/20">
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Type</label>
                      <p className="mt-1">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          lead.campaign.type === 'sale'
                            ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
                            : lead.campaign.type === 'reach'
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        )}>
                          {lead.campaign.type.charAt(0).toUpperCase() + lead.campaign.type.slice(1)}
                        </span>
                      </p>
                    </div>
                    {lead.campaign.budget && (
                      <div>
                        <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Budget</label>
                        <p className="mt-1 text-amber-100 font-medium">
                          {formatCurrency(lead.campaign.budget)}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Start Date</label>
                      <p className="mt-1 text-amber-200/80 text-sm">{formatDate(lead.campaign.startDate)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">End Date</label>
                      <p className="mt-1 text-amber-200/80 text-sm">{formatDate(lead.campaign.endDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </GamePanel>
          )}

          {/* Conversation Messages */}
          {lead.conversation && lead.conversation.messages && lead.conversation.messages.length > 0 && (
            <GamePanel>
              <div className="p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  Conversation Messages
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {lead.conversation.messages
                    .slice()
                    .reverse()
                    .map((message: any) => (
                      <div
                        key={message.id}
                        className={cn(
                          "p-3 rounded-lg",
                          message.senderType === 'agent'
                            ? "bg-amber-500/10 border border-amber-500/30 ml-8"
                            : "bg-slate-800/60 border border-amber-500/20 mr-8"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-amber-200/80">
                            {message.senderType === 'agent' ? 'Agent' : 'Customer'}
                          </span>
                          <span className="text-xs text-amber-200/60">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        {message.imageUrl && (
                          <img
                            src={getImageUrl(message.imageUrl)}
                            alt="Message attachment"
                            className="max-w-xs rounded-lg mb-2 border border-amber-500/20"
                          />
                        )}
                        <p className="text-sm text-amber-100 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                </div>
              </div>
            </GamePanel>
          )}

          {/* Lead Meetings */}
          <GamePanel>
            <div className="p-6">
              <div className="flex flex-row items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  Meetings
                </h3>
                <Button size="sm" onClick={openCreateMeetingForm} className={btnOutline}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
              {isLoadingMeetings ? (
                <div className="text-amber-200/70 py-4">Loading meetings...</div>
              ) : meetings.length === 0 ? (
                <div className="text-amber-200/60 py-4">No meetings scheduled for this lead.</div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting, idx) => (
                    <GameCard key={meeting.id} index={idx} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-amber-100">{meeting.title}</span>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium border',
                                meeting.status === 'Scheduled' && 'bg-amber-500/20 text-amber-200 border-amber-500/40',
                                meeting.status === 'Completed' && 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                                meeting.status === 'Canceled' && 'bg-red-500/20 text-red-300 border-red-500/40'
                              )}
                            >
                              {meeting.status}
                            </span>
                          </div>
                          <div className="text-sm text-amber-200/80 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400/80" />
                            <span>{formatMeetingDate(meeting.meetingTime)}</span>
                            <span className="text-amber-400/40">•</span>
                            <span>{meeting.durationMinutes} min</span>
                          </div>
                          {meeting.meetingLink && meeting.status === 'Scheduled' && (
                            <a
                              href={meeting.platform.toLowerCase() === 'offline' ? undefined : meeting.meetingLink.startsWith('http') ? meeting.meetingLink : `https://${meeting.meetingLink}`}
                              target={meeting.platform.toLowerCase() === 'offline' ? undefined : "_blank"}
                              rel={meeting.platform.toLowerCase() === 'offline' ? undefined : "noopener noreferrer"}
                              className={cn(
                                "flex items-center text-xs font-medium bg-white/5 px-2 py-1 rounded",
                                meeting.platform.toLowerCase() === 'offline' ? "text-amber-200/80 cursor-default" : "text-amber-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
                              )}
                            >
                              <span className="mr-1.5 opacity-70">[{meeting.platform}]</span>
                              <span className="truncate max-w-[150px]">{meeting.meetingLink}</span>
                            </a>
                          )}
                          {meeting.description && (
                            <p className="text-sm text-amber-200/70 mt-1">{meeting.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/20"
                              onClick={() => openEditMeetingForm(meeting)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              onClick={() => deleteMeetingMutation.mutate(meeting.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="text-xs text-amber-200/50">Created {formatMeetingDate(meeting.createdAt)}</span>
                        </div>
                      </div>
                    </GameCard>
                  ))}
                </div>
              )}

              {isMeetingFormOpen && (
                <form
                  onSubmit={handleSubmit(handleMeetingSubmit)}
                  className="mt-4 space-y-4 border-t border-amber-500/20 pt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Title</label>
                      <Input {...register('title')} className={cn('mt-1', inputDark)} placeholder="Meeting title" />
                      {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Meeting Time</label>
                      <Input type="datetime-local" {...register('meetingTime')} className={cn('mt-1', inputDark)} />
                      {errors.meetingTime && <p className="text-xs text-red-400 mt-1">{errors.meetingTime.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Duration (minutes)</label>
                      <Input
                        type="number"
                        {...register('durationMinutes', { valueAsNumber: true })}
                        className={cn('mt-1', inputDark)}
                        min={1}
                      />
                      {errors.durationMinutes && <p className="text-xs text-red-400 mt-1">{errors.durationMinutes.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block">
                        Platform
                      </label>
                      <select
                        {...register('platform')}
                        className={cn('mt-1 w-full px-3 py-2 rounded-lg border border-amber-500/20 bg-slate-800/60 text-amber-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50')}
                      >
                        {['Offline', 'WhatsApp', 'Messenger', 'Telegram', 'Viber', 'Zoom', 'Google meet', 'Teams', 'Skype'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      {errors.platform && <p className="text-xs text-red-400 mt-1">{errors.platform.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block">
                        Meeting Location / Link
                      </label>
                      <Input {...register('meetingLink')} className={cn('mt-1', inputDark)} placeholder="Address or URL..." />
                      {errors.meetingLink && <p className="text-xs text-red-400 mt-1">{errors.meetingLink.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Notes</label>
                    <Textarea {...register('description')} className={cn('mt-1', inputDark)} placeholder="Add any notes about this meeting..." />
                    {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Assigned To *</label>
                    {user?.companyId && (
                      <EmployeeSelector
                        companyId={user.companyId}
                        selectedEmployeeIds={selectedMeetingEmployeeId}
                        onSelectionChange={setSelectedMeetingEmployeeId}
                        disabledEmployeeIds={busyEmployeeIdsMeeting}
                        disabledReasonByEmployeeId={Object.fromEntries(busyEmployeeIdsMeeting.map((id) => [id, 'Booked']))}
                      />
                    )}
                    {errors.assignedTo && <p className="text-xs text-red-400 mt-1">{errors.assignedTo.message}</p>}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      className={btnOutline}
                      onClick={() => { setIsMeetingFormOpen(false); setEditingMeeting(null); setSelectedMeetingEmployeeId([]); reset(); }}
                      disabled={isSubmitting || createMeetingMutation.isPending || updateMeetingMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-500 text-white"
                      disabled={isSubmitting || createMeetingMutation.isPending || updateMeetingMutation.isPending || selectedMeetingEmployeeId.length === 0}
                    >
                      {(createMeetingMutation.isPending || updateMeetingMutation.isPending) && (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      )}
                      {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </GamePanel>
        </div>

        {/* Sidebar - Right Side (1 column) */}
        <div className="space-y-6">
          {/* Lead Details */}
          <GamePanel>
            <div className="p-6 space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                <Briefcase className="w-5 h-5 text-amber-400" />
                Lead Details
              </h3>
              {lead.category && (
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Category</label>
                  <p className="mt-1">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs rounded-full font-medium">
                      {lead.category.name}
                    </span>
                  </p>
                </div>
              )}
              {lead.interest && (
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Interest</label>
                  <p className="mt-1">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs rounded-full font-medium">
                      {lead.interest.name}
                    </span>
                  </p>
                </div>
              )}
              {lead.value && (
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Estimated Value</label>
                  <p className="mt-1 text-emerald-300 font-medium text-lg">{formatCurrency(lead.value)}</p>
                </div>
              )}
            </div>
          </GamePanel>

          {/* Assignment */}
          <GamePanel>
            <div className="p-6 space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                <Users className="w-5 h-5 text-amber-400" />
                Assignment
              </h3>
              {lead.assignments && lead.assignments.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {lead.assignments.map((a) => {
                    const displayName = a.employee?.user?.name || a.employee?.user?.email || 'Employee';
                    const email = a.employee?.user?.email || '';
                    const rating = ((a.employeeId || 0) % 30) + 70;
                    const roleName = a.employee?.user?.role?.name || 'TEAM';
                    return (
                      <div
                        key={a.id}
                        className="relative rounded-xl overflow-visible border-2 border-amber-500/40 bg-gradient-to-b from-slate-800/95 to-slate-900/98 hover:border-amber-500/60 transition-all group min-h-[88px]"
                      >
                        <div className="h-7 flex items-center justify-center text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-600/90 via-amber-500 to-amber-600/90 text-amber-950">
                          {roleName}
                        </div>
                        <div className="flex items-center gap-4 p-4">
                          {a.employee?.user?.profileImage ? (
                            <img src={a.employee.user.profileImage} alt={displayName} className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/40 flex-shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-amber-500/30 border-2 border-amber-500/40 flex items-center justify-center text-2xl font-bold text-amber-200 flex-shrink-0">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-amber-100">{displayName}</p>
                            <p className="text-sm text-amber-200/80 mt-0.5">{email}</p>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-base font-black text-amber-950 border-2 border-amber-400/50 flex-shrink-0 shadow-lg">
                            {rating}
                          </div>
                        </div>
                        {user?.companyId && (user?.roleName === 'Lead Manager' || user?.roleName === 'SuperAdmin' || hasPermission?.('can_manage_leads')) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500/40 text-red-200 hover:bg-red-500/60 hover:text-red-100 border border-red-500/40"
                            onClick={() => removeAssignmentMutation.mutate(a.employeeId)}
                            disabled={removeAssignmentMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-amber-200/60">Not assigned</p>
              )}
              {user?.companyId && (user?.roleName === 'Lead Manager' || user?.roleName === 'SuperAdmin' || hasPermission?.('can_manage_leads')) && (
                <div className="pt-4 border-t border-amber-500/20">
                  <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-2">অ্যাসাইন যোগ করুন</p>
                  <EmployeeSelector companyId={user.companyId} selectedEmployeeIds={leadAssignmentsSelectedIds} onSelectionChange={setLeadAssignmentsSelectedIds} variant="fifa" />
                  <Button
                    size="sm"
                    className={cn('mt-2', 'bg-amber-600 hover:bg-amber-500 text-white')}
                    disabled={assignUsersMutation.isPending || leadAssignmentsSelectedIds.length === 0}
                    onClick={() => assignUsersMutation.mutate(leadAssignmentsSelectedIds)}
                  >
                    {assignUsersMutation.isPending ? 'যোগ করা হচ্ছে...' : 'যোগ করুন'}
                  </Button>
                </div>
              )}
            </div>
          </GamePanel>

          {/* Created By */}
          <GamePanel>
            <div className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
                <User className="w-5 h-5 text-amber-400" />
                Created By
              </h3>
              {lead.createdByUser ? (
                <div className="flex items-center gap-3">
                  {lead.createdByUser.profileImage ? (
                    <img src={lead.createdByUser.profileImage} alt={lead.createdByUser.email} className="w-10 h-10 rounded-full border border-amber-500/20" />
                  ) : (
                    <div className="w-10 h-10 bg-amber-500/30 rounded-full flex items-center justify-center text-amber-200 font-medium border border-amber-500/30">
                      {lead.createdByUser.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-amber-100">{lead.createdByUser.name || lead.createdByUser.email}</p>
                    <p className="text-xs text-amber-200/60">{lead.createdByUser.email}</p>
                    {lead.createdByUser.role && <p className="text-xs text-amber-200/60 mt-1">{lead.createdByUser.role.name}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-amber-200/60">Unknown</p>
              )}
            </div>
          </GamePanel>

          {/* Timeline */}
          <GamePanel>
            <div className="p-6 space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
                <Clock className="w-5 h-5 text-amber-400" />
                Timeline
              </h3>
              <div>
                <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Created At</label>
                <p className="mt-1 text-sm text-amber-200/90">{formatDate(lead.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Last Updated</label>
                <p className="mt-1 text-sm text-amber-200/90">{formatDate(lead.updatedAt)}</p>
              </div>
            </div>
          </GamePanel>

          {/* Call Schedule */}
          <GamePanel>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                  <Phone className="w-5 h-5 text-amber-400" />
                  Call Schedule
                </h3>
                <Button size="sm" onClick={openCreateCallForm} disabled={isCallFormOpen} className={btnOutline}>
                  <Plus className="w-4 h-4 mr-1" />
                  Schedule Call
                </Button>
              </div>
              {isLoadingCalls ? (
                <div className="text-center py-4 text-amber-200/70 text-sm">Loading calls...</div>
              ) : calls.length === 0 ? (
                <div className="text-center py-4 text-amber-200/60 text-sm">No calls scheduled</div>
              ) : (
                <div className="space-y-3">
                  {calls.map((call, idx) => (
                    <GameCard key={call.id} index={idx} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {call.title && <span className="font-medium text-amber-100">{call.title}</span>}
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', getCallStatusColor(call.status))}>
                              {call.status}
                            </span>
                          </div>
                          <div className="text-sm text-amber-200/80 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400/80" />
                            <span>{formatMeetingDate(call.callTime)}</span>
                            {call.durationMinutes && <><span className="text-amber-400/40">•</span><span>{call.durationMinutes} min</span></>}
                          </div>
                          {call.phoneNumber && (
                            <div className="text-sm text-amber-200/80 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{call.phoneNumber}</span>
                            </div>
                          )}
                          {call.assignedEmployee && (
                            <div className="text-sm text-amber-200/80 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{call.assignedEmployee.user?.email || 'Employee'}</span>
                            </div>
                          )}
                          {call.notes && (
                            <div className="text-sm text-amber-200/90 mt-2 p-2 bg-slate-800/60 rounded border border-amber-500/20">
                              <strong className="text-amber-200/80">Notes:</strong> {call.notes}
                            </div>
                          )}
                          {editingCallNote?.callId === call.id && (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={editingCallNote.note}
                                onChange={(e) => setEditingCallNote({ callId: call.id, note: e.target.value })}
                                placeholder="Add call notes..."
                                className={cn('text-sm', inputDark)}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-500 text-white"
                                  onClick={() => {
                                    if (editingCallNote.note.trim()) {
                                      addCallNoteMutation.mutate({ callId: call.id, note: editingCallNote.note });
                                    } else {
                                      setEditingCallNote(null);
                                    }
                                  }}
                                  disabled={addCallNoteMutation.isPending}
                                >
                                  Save Note
                                </Button>
                                <Button size="sm" className={btnOutline} onClick={() => setEditingCallNote(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex gap-2">
                            {!editingCallNote || editingCallNote.callId !== call.id ? (
                              <Button variant="ghost" size="sm" className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/20" onClick={() => setEditingCallNote({ callId: call.id, note: call.notes || '' })} title="Add note">
                                <FileText className="w-4 h-4" />
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="sm" className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/20" onClick={() => openEditCallForm(call)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => deleteCallMutation.mutate(call.id)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </GameCard>
                  ))}
                </div>
              )}

              {isCallFormOpen && (
                <form onSubmit={handleCallSubmit(onCallSubmit)} className="mt-4 space-y-4 border-t border-amber-500/20 pt-4">
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Title (Optional)</label>
                    <Input {...registerCall('title')} className={cn('mt-1', inputDark)} placeholder="Call title" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Phone Number</label>
                    <Input {...registerCall('phoneNumber')} className={cn('mt-1', inputDark)} placeholder={lead?.phone || 'Phone number'} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Call Time *</label>
                    <Input type="datetime-local" {...registerCall('callTime')} className={cn('mt-1', inputDark)} />
                    {callErrors.callTime && <p className="text-xs text-red-400 mt-1">{callErrors.callTime.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Duration (minutes, optional)</label>
                    <Input type="number" {...registerCall('durationMinutes', { valueAsNumber: true })} className={cn('mt-1', inputDark)} min={1} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Assigned To *</label>
                    {user?.companyId && (
                      <EmployeeSelector
                        companyId={user.companyId}
                        selectedEmployeeIds={selectedEmployeeId}
                        onSelectionChange={setSelectedEmployeeId}
                        disabledEmployeeIds={busyEmployeeIdsCall}
                        disabledReasonByEmployeeId={Object.fromEntries(busyEmployeeIdsCall.map((id) => [id, 'Booked']))}
                      />
                    )}
                    {callErrors.assignedTo && <p className="text-xs text-red-400 mt-1">{callErrors.assignedTo.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Status</label>
                    <select
                      {...registerCall('status')}
                      className={cn('w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1', inputDark)}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                      <option value="NoAnswer">No Answer</option>
                      <option value="Busy">Busy</option>
                      <option value="LeftVoicemail">Left Voicemail</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      className={btnOutline}
                      onClick={() => { setIsCallFormOpen(false); setEditingCall(null); setSelectedEmployeeId([]); resetCall(); }}
                      disabled={isCallSubmitting || createCallMutation.isPending || updateCallMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-500 text-white"
                      disabled={isCallSubmitting || createCallMutation.isPending || updateCallMutation.isPending || selectedEmployeeId.length === 0}
                    >
                      {(createCallMutation.isPending || updateCallMutation.isPending) && (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      )}
                      {editingCall ? 'Update Call' : 'Schedule Call'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </GamePanel>
        </div>
      </div>

      {/* Convert to Client Modal */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GamePanel className="w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  Convert Lead to Client
                </h3>
                <button onClick={() => setIsConvertModalOpen(false)} className="p-2 rounded-lg text-amber-200 hover:bg-amber-500/20 hover:text-amber-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleConvertSubmit(onConvertSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Client Name</label>
                  <Input {...registerConvert('name')} className={cn('mt-1', inputDark)} placeholder={lead?.customerName || lead?.title || 'Client name'} />
                  {convertErrors.name && <p className="text-xs text-red-400 mt-1">{convertErrors.name.message}</p>}
                  <p className="text-xs text-amber-200/60 mt-1">Leave empty to use lead title: {lead?.title}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">ইমেইল * (লগইনের জন্য)</label>
                  <Input type="email" {...registerConvert('email')} className={cn('mt-1', inputDark)} placeholder="client@example.com" />
                  {convertErrors.email && <p className="text-xs text-red-400 mt-1">{convertErrors.email.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Phone (Optional)</label>
                  <Input {...registerConvert('phone')} className={cn('mt-1', inputDark)} placeholder={lead?.phone || 'Phone number'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">পাসওয়ার্ড * (ক্লায়েন্ট লগইনের জন্য)</label>
                  <Input type="password" {...registerConvert('password')} className={cn('mt-1', inputDark)} placeholder="কমপক্ষে ৬ অক্ষর" autoComplete="new-password" />
                  {convertErrors.password && <p className="text-xs text-red-400 mt-1">{convertErrors.password.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">পাসওয়ার্ড নিশ্চিত করুন *</label>
                  <Input type="password" {...registerConvert('confirmPassword')} className={cn('mt-1', inputDark)} placeholder="পাসওয়ার্ড আবার লিখুন" autoComplete="new-password" />
                  {convertErrors.confirmPassword && <p className="text-xs text-red-400 mt-1">{convertErrors.confirmPassword.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Address (Optional)</label>
                  <Textarea {...registerConvert('address')} className={cn('mt-1', inputDark)} rows={3} placeholder="Client address" />
                </div>
                <div className="flex gap-3 pt-4 border-t border-amber-500/20">
                  <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white" disabled={convertToClientMutation.isPending}>
                    {convertToClientMutation.isPending && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                    Convert to Client
                  </Button>
                  <Button type="button" className={btnOutline} onClick={() => setIsConvertModalOpen(false)} disabled={convertToClientMutation.isPending}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </GamePanel>
        </div>
      )}

      {/* Status Change Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GamePanel className="w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  স্ট্যাটাস পরিবর্তন করুন
                </h3>
                <button onClick={() => setIsStatusModalOpen(false)} className="p-2 rounded-lg text-amber-200 hover:bg-amber-500/20 hover:text-amber-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-amber-200/80 mb-4">
                  বর্তমান স্ট্যাটাস: <span className={cn("px-2 py-1 rounded border text-xs font-medium", getStatusColor(lead.status))}>{lead.status}</span>
                </p>
                <div className="space-y-2">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedStatus(opt.value)}
                      disabled={lead.status === opt.value}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        selectedStatus === opt.value ? "border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/40" : "border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10",
                        lead.status === opt.value && "opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("px-2 py-1 rounded border text-sm font-medium", getStatusColor(opt.value))}>
                          {opt.label}
                        </span>
                        {lead.status === opt.value && <span className="text-xs text-amber-200/60">(বর্তমান)</span>}
                        {selectedStatus === opt.value && lead.status !== opt.value && <CheckCircle className="w-5 h-5 text-amber-400" />}
                      </div>
                      {opt.value === 'Won' && lead.status !== 'Won' && (
                        <p className="text-xs text-emerald-400 mt-2">✨ এই স্ট্যাটাস সিলেক্ট করলে রিজার্ভ পয়েন্ট মেইন পয়েন্টে ট্রান্সফার হবে</p>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-4 border-t border-amber-500/20">
                  <Button onClick={handleStatusUpdate} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white" disabled={updateStatusMutation.isPending || selectedStatus === lead.status}>
                    {updateStatusMutation.isPending && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                    স্ট্যাটাস আপডেট করুন
                  </Button>
                  <Button className={btnOutline} onClick={() => setIsStatusModalOpen(false)} disabled={updateStatusMutation.isPending}>
                    বাতিল
                  </Button>
                </div>
              </div>
            </div>
          </GamePanel>
        </div>
      )}

      {/* Transfer Monitoring Modal */}
      {isTransferMonitoringModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GamePanel className="w-full max-w-md shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                  <Users className="w-5 h-5 text-amber-400" />
                  Transfer Monitoring
                </h3>
                <button
                  onClick={() => { setIsTransferMonitoringModalOpen(false); setNewLeadManagerUserId(''); setManagerSearch(''); }}
                  className="p-2 rounded-lg text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">নতুন Lead Manager বেছে নিন</label>
                {/* Searchable manager picker */}
                <div className="mt-2 relative">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2" /><path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" /></svg>
                    <input
                      type="text"
                      value={managerSearch}
                      onChange={(e) => setManagerSearch(e.target.value)}
                      placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-amber-500/20 bg-slate-800/80 text-amber-100 placeholder-amber-500/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-amber-500/20 bg-slate-900/90">
                    {leadManagers
                      .filter((m) => m.id !== user?.id)
                      .filter((m) => {
                        const q = managerSearch.toLowerCase();
                        return !q || (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
                      })
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setNewLeadManagerUserId(m.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-amber-500/10 ${newLeadManagerUserId === m.id ? 'bg-amber-500/20 border-l-2 border-amber-400' : 'border-l-2 border-transparent'
                            }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-500/30 border border-amber-500/40 flex items-center justify-center text-amber-200 font-bold text-sm shrink-0">
                            {(m.name || m.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-amber-100 truncate">{m.name || m.email}</p>
                            {m.name && <p className="text-xs text-amber-200/60 truncate">{m.email}</p>}
                          </div>
                          {newLeadManagerUserId === m.id && (
                            <svg className="ml-auto w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          )}
                        </button>
                      ))}
                    {leadManagers.filter((m) => m.id !== user?.id).filter((m) => {
                      const q = managerSearch.toLowerCase();
                      return !q || (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
                    }).length === 0 && (
                        <p className="text-center py-4 text-amber-200/50 text-sm">কোনো লিড ম্যানেজার পাওয়া যায়নি</p>
                      )}
                  </div>
                </div>
                <p className="text-xs text-amber-200/60 mt-2">
                  Only the current monitoring incharge can transfer this responsibility to another Lead Manager.
                </p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-amber-500/20">
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
                  disabled={transferMonitoringMutation.isPending || !newLeadManagerUserId}
                  onClick={() => transferMonitoringMutation.mutate()}
                >
                  {transferMonitoringMutation.isPending && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                  Transfer
                </Button>
                <Button
                  className={btnOutline}
                  onClick={() => { setIsTransferMonitoringModalOpen(false); setNewLeadManagerUserId(''); setManagerSearch(''); }}
                  disabled={transferMonitoringMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </GamePanel>
        </div>
      )}
      {/* ─── Lead Edit Modal ───────────────────────────────────────────────── */}
      {isEditLeadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-xl" style={{ background: 'linear-gradient(180deg,#1e293b 0%,#0f172a 100%)', boxShadow: '0 0 0 1px rgba(217,119,6,0.3),0 25px 50px -12px rgba(0,0,0,0.7)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-amber-500/20">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                <Edit className="w-5 h-5 text-amber-400" />
                লিড এডিট করুন
              </h3>
              <button onClick={() => setIsEditLeadModalOpen(false)} className="p-2 rounded-lg text-amber-200 hover:bg-amber-500/20">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Row: Title + Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">শিরোনাম (Title) *</label>
                  <Input
                    value={editLeadForm.title || ''}
                    onChange={(e) => handleEditLeadField('title', e.target.value)}
                    className={inputDark}
                    placeholder="Lead title"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">সোর্স (Source)</label>
                  <select
                    value={editLeadForm.source || ''}
                    onChange={(e) => handleEditLeadField('source', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-500/20 bg-slate-800/60 text-amber-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    {['Website', 'Referral', 'SocialMedia', 'Email', 'Phone', 'Inbox', 'Other'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">বিবরণ (Description)</label>
                <Textarea
                  value={editLeadForm.description || ''}
                  onChange={(e) => handleEditLeadField('description', e.target.value)}
                  className={inputDark}
                  rows={3}
                  placeholder="Lead description..."
                />
              </div>

              {/* Row: Customer Name + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">কাস্টমার নাম</label>
                  <Input
                    value={editLeadForm.customerName || ''}
                    onChange={(e) => handleEditLeadField('customerName', e.target.value)}
                    className={inputDark}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">ফোন নম্বর</label>
                  <Input
                    value={editLeadForm.phone || ''}
                    onChange={(e) => handleEditLeadField('phone', e.target.value)}
                    className={inputDark}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              {/* Row: Category + Interest */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">ক্যাটাগরি</label>
                  <select
                    value={editLeadForm.categoryId || ''}
                    onChange={(e) => handleEditLeadField('categoryId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-500/20 bg-slate-800/60 text-amber-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">-- কোনো ক্যাটাগরি নেই --</option>
                    {editCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">ইন্টারেস্ট</label>
                  <select
                    value={editLeadForm.interestId || ''}
                    onChange={(e) => handleEditLeadField('interestId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-500/20 bg-slate-800/60 text-amber-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">-- কোনো ইন্টারেস্ট নেই --</option>
                    {editInterests.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row: Campaign + Product */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">ক্যাম্পেইন</label>
                  <select
                    value={editLeadForm.campaignId || ''}
                    onChange={(e) => handleEditLeadField('campaignId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-500/20 bg-slate-800/60 text-amber-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">-- কোনো ক্যাম্পেইন নেই --</option>
                    {editCampaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">প্রোডাক্ট</label>
                  <select
                    value={editLeadForm.productId || ''}
                    onChange={(e) => handleEditLeadField('productId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-500/20 bg-slate-800/60 text-amber-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">-- কোনো প্রোডাক্ট নেই --</option>
                    {editProducts.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-amber-500/10 pt-4">
                <p className="text-sm font-semibold text-amber-200/80 mb-3">মূল্য তথ্য (Pricing)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">ভ্যালু (৳)</label>
                    <Input
                      type="number"
                      value={editLeadForm.value || ''}
                      onChange={(e) => handleEditLeadField('value', e.target.value)}
                      className={inputDark}
                      placeholder="0"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">ক্রয় মূল্য (৳)</label>
                    <Input
                      type="number"
                      value={editLeadForm.purchasePrice || ''}
                      onChange={(e) => {
                        handleEditLeadField('purchasePrice', e.target.value);
                        handleAutoProfit({ ...editLeadForm, purchasePrice: e.target.value });
                      }}
                      className={inputDark}
                      placeholder="0"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">বিক্রয় মূল্য (৳)</label>
                    <Input
                      type="number"
                      value={editLeadForm.salePrice || ''}
                      onChange={(e) => {
                        handleEditLeadField('salePrice', e.target.value);
                        handleAutoProfit({ ...editLeadForm, salePrice: e.target.value });
                      }}
                      className={inputDark}
                      placeholder="0"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-200/70 uppercase tracking-wider block mb-1">মুনাফা (৳)</label>
                    <Input
                      type="number"
                      value={editLeadForm.profit || ''}
                      onChange={(e) => handleEditLeadField('profit', e.target.value)}
                      className={cn(inputDark, Number(editLeadForm.profit) < 0 ? 'border-red-500/50' : '')}
                      placeholder="স্বয়ংক্রিয়"
                    />
                    <p className="text-[10px] text-amber-200/50 mt-0.5">ক্রয়-বিক্রয় দিলে স্বয়ংক্রিয়</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-6 border-t border-amber-500/20">
              <Button
                variant="outline"
                onClick={() => setIsEditLeadModalOpen(false)}
                className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                disabled={updateLeadMutation.isPending}
              >
                বাতিল
              </Button>
              <Button
                onClick={handleSaveEditLead}
                disabled={updateLeadMutation.isPending || !editLeadForm.title}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                {updateLeadMutation.isPending && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                সেভ করুন
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────── */}
    </div>
  );
}

