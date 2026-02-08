import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { leadApi, bookingApi } from '@/lib/api';
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
    googleMeetUrl: z.string().url('Valid Google Meet URL is required'),
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
      googleMeetUrl: '',
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
      googleMeetUrl: '',
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
      googleMeetUrl: meeting.googleMeetUrl,
      status: meeting.status as LeadMeetingStatus,
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
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Canceled': return 'bg-red-100 text-red-700';
      case 'NoAnswer': return 'bg-yellow-100 text-yellow-700';
      case 'Busy': return 'bg-orange-100 text-orange-700';
      case 'LeftVoicemail': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md shadow-sm border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Lead Not Found</h3>
              <p className="text-slate-600 mb-4">
                {error ? 'Failed to load lead details' : 'The lead you are looking for does not exist'}
              </p>
              <Button onClick={() => navigate('/leads')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Won': return 'bg-green-100 text-green-700 border-green-200';
      case 'Lost': return 'bg-red-100 text-red-700 border-red-200';
      case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Contacted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Qualified': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Negotiation': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/leads')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{lead.title}</h1>
            <p className="text-slate-600 mt-1">Lead ID: #{lead.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Clickable Status Badge - only Lead Manager (and SuperAdmin) can change status; locked by monitoring incharge */}
          {isMonitoringAllowed ? (
            <button
              onClick={openStatusModal}
              className={cn(
                "px-4 py-2 rounded-lg border flex items-center gap-2 font-medium text-sm cursor-pointer hover:opacity-80 transition-opacity",
                getStatusColor(lead.status)
              )}
              title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
            >
              {getStatusIcon(lead.status)}
              {lead.status}
              <Edit className="w-3 h-3 ml-1" />
            </button>
          ) : (
            <span
              className={cn(
                "px-4 py-2 rounded-lg border flex items-center gap-2 font-medium text-sm",
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
            <span className="px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 font-medium text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Already added as client
            </span>
          ) : (
            lead.status === 'Won' && isMonitoringAllowed && (
              <Button 
                onClick={openConvertModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Convert to Client
              </Button>
            )
          )}
          {isLeadManagerOrSuperAdmin && (user?.roleName === 'SuperAdmin' || lead?.leadMonitoringUserId === user?.id) && (
            <Button
              variant="outline"
              onClick={() => setIsTransferMonitoringModalOpen(true)}
              disabled={!lead?.leadMonitoringUserId}
              title={!lead?.leadMonitoringUserId ? 'Monitoring incharge is not assigned yet' : 'Transfer monitoring responsibility'}
            >
              <Users className="w-4 h-4 mr-2" />
              Transfer Monitoring
            </Button>
          )}
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Title</label>
                  <p className="mt-1 text-slate-900 font-medium">{lead.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Source</label>
                  <p className="mt-1 flex items-center gap-2">
                    {getSourceIcon(lead.source)}
                    <span className="text-slate-900">{lead.source}</span>
                  </p>
                </div>
                {lead.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-600">Description</label>
                    <p className="mt-1 text-slate-700 whitespace-pre-wrap">{lead.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monitoring */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-slate-600">Lead Monitoring Incharge</label>
                    <p className="mt-1 text-slate-900 font-medium">
                      {lead.leadMonitoringUser
                        ? (lead.leadMonitoringUser.name || lead.leadMonitoringUser.email)
                        : 'Not assigned yet'}
                    </p>
                    {lead.leadMonitoringUser?.email && lead.leadMonitoringUser?.name && (
                      <p className="text-xs text-slate-500">{lead.leadMonitoringUser.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-slate-600">Finance Monitoring</label>
                    <p className="mt-1 text-slate-900 font-medium">
                      {lead.clientApprovalRequest?.status === 'Approved'
                        ? (lead.clientApprovalRequest.approvedByUser?.name ||
                            lead.clientApprovalRequest.approvedByUser?.email ||
                            'Approved')
                        : lead.clientApprovalRequest?.status === 'Pending'
                          ? 'Pending approval'
                          : '—'}
                    </p>
                    {lead.clientApprovalRequest?.status === 'Approved' && lead.clientApprovalRequest.approvedAt && (
                      <p className="text-xs text-slate-500">
                        Approved at: {new Date(lead.clientApprovalRequest.approvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.customerName && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-slate-600">Customer Name</label>
                      <p className="mt-1 text-slate-900 font-medium">{lead.customerName}</p>
                    </div>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-slate-600">Phone</label>
                      <p className="mt-1 text-slate-900 font-medium">{lead.phone}</p>
                    </div>
                  </div>
                )}
                {lead.conversation && (
                  <div className="md:col-span-2 flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-slate-600">Source Conversation</label>
                      <p className="mt-1 text-slate-900">
                        {lead.conversation.platform === 'facebook' ? 'Facebook' : 'Chatwoot'} - 
                        {lead.conversation.externalUserName || lead.conversation.externalUserId}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Information (for Sales Leads) */}
          {lead.product && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  {lead.product.imageUrl && (
                    <img
                      src={lead.product.imageUrl}
                      alt={lead.product.name}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Product Name</label>
                      <p className="mt-1 text-slate-900 font-medium text-lg">{lead.product.name}</p>
                      {lead.product.description && (
                        <p className="mt-2 text-sm text-slate-600">{lead.product.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Purchase Price</label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {formatCurrency(lead.purchasePrice || lead.product.purchasePrice)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Sale Price</label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {formatCurrency(lead.salePrice || lead.product.salePrice)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Profit</label>
                        <p className={cn(
                          "mt-1 font-medium",
                          lead.profit && Number(lead.profit) > 0 
                            ? "text-green-600" 
                            : lead.profit && Number(lead.profit) < 0
                            ? "text-red-600"
                            : "text-slate-900"
                        )}>
                          {formatCurrency(lead.profit)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Currency</label>
                        <p className="mt-1 text-slate-900 font-medium">{lead.product.currency || 'BDT'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaign Information */}
          {lead.campaign && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Campaign Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Campaign Name</label>
                    <p className="mt-1 text-slate-900 font-medium">{lead.campaign.name}</p>
                  </div>
                  {lead.campaign.description && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">Description</label>
                      <p className="mt-1 text-slate-700">{lead.campaign.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-200">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Type</label>
                      <p className="mt-1">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          lead.campaign.type === 'sale' 
                            ? "bg-indigo-100 text-indigo-700"
                            : lead.campaign.type === 'reach'
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        )}>
                          {lead.campaign.type.charAt(0).toUpperCase() + lead.campaign.type.slice(1)}
                        </span>
                      </p>
                    </div>
                    {lead.campaign.budget && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Budget</label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {formatCurrency(lead.campaign.budget)}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-slate-600">Start Date</label>
                      <p className="mt-1 text-slate-700 text-sm">{formatDate(lead.campaign.startDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">End Date</label>
                      <p className="mt-1 text-slate-700 text-sm">{formatDate(lead.campaign.endDate)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversation Messages */}
          {lead.conversation && lead.conversation.messages && lead.conversation.messages.length > 0 && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Conversation Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                            ? "bg-indigo-50 border border-indigo-200 ml-8"
                            : "bg-gray-50 border border-gray-200 mr-8"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-600">
                            {message.senderType === 'agent' ? 'Agent' : 'Customer'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        {message.imageUrl && (
                          <img
                            src={getImageUrl(message.imageUrl)}
                            alt="Message attachment"
                            className="max-w-xs rounded-lg mb-2"
                          />
                        )}
                        <p className="text-sm text-slate-900 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lead Meetings */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Meetings
              </CardTitle>
              <Button
                size="sm"
                onClick={openCreateMeetingForm}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingMeetings ? (
                <div className="text-slate-500 py-4">Loading meetings...</div>
              ) : meetings.length === 0 ? (
                <div className="text-slate-500 py-4">
                  No meetings scheduled for this lead.
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {meeting.title}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              meeting.status === 'Scheduled' &&
                                'bg-blue-100 text-blue-700',
                              meeting.status === 'Completed' &&
                                'bg-green-100 text-green-700',
                              meeting.status === 'Canceled' &&
                                'bg-red-100 text-red-700'
                            )}
                          >
                            {meeting.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatMeetingDate(meeting.meetingTime)}</span>
                          <span className="text-slate-400">•</span>
                          <span>{meeting.durationMinutes} min</span>
                        </div>
                        <div className="text-sm">
                          <a
                            href={meeting.googleMeetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline text-xs break-all"
                          >
                            {meeting.googleMeetUrl}
                          </a>
                        </div>
                        {meeting.description && (
                          <p className="text-sm text-slate-700 mt-1">
                            {meeting.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditMeetingForm(meeting)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteMeetingMutation.mutate(meeting.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-xs text-slate-400">
                          Created at {formatMeetingDate(meeting.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isMeetingFormOpen && (
                <form
                  onSubmit={handleSubmit(handleMeetingSubmit)}
                  className="mt-4 space-y-4 border-t pt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        Title
                      </label>
                      <Input
                        {...register('title')}
                        className="mt-1"
                        placeholder="Meeting title"
                      />
                      {errors.title && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.title.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        Meeting Time
                      </label>
                      <Input
                        type="datetime-local"
                        {...register('meetingTime')}
                        className="mt-1"
                      />
                      {errors.meetingTime && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.meetingTime.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        Duration (minutes)
                      </label>
                      <Input
                        type="number"
                        {...register('durationMinutes', {
                          valueAsNumber: true,
                        })}
                        className="mt-1"
                        min={1}
                      />
                      {errors.durationMinutes && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.durationMinutes.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        Google Meet URL
                      </label>
                      <Input
                        {...register('googleMeetUrl')}
                        className="mt-1"
                        placeholder="https://meet.google.com/..."
                      />
                      {errors.googleMeetUrl && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.googleMeetUrl.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Notes
                    </label>
                    <Textarea
                      {...register('description')}
                      className="mt-1"
                      placeholder="Add any notes about this meeting..."
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Assigned To *</label>
                    {user?.companyId && (
                      <EmployeeSelector
                        companyId={user.companyId}
                        selectedEmployeeIds={selectedMeetingEmployeeId}
                        onSelectionChange={setSelectedMeetingEmployeeId}
                        disabledEmployeeIds={busyEmployeeIdsMeeting}
                        disabledReasonByEmployeeId={Object.fromEntries(
                          busyEmployeeIdsMeeting.map((id) => [id, 'Booked'])
                        )}
                      />
                    )}
                    {errors.assignedTo && (
                      <p className="text-xs text-red-500 mt-1">{errors.assignedTo.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsMeetingFormOpen(false);
                        setEditingMeeting(null);
                        setSelectedMeetingEmployeeId([]);
                        reset();
                      }}
                      disabled={isSubmitting || createMeetingMutation.isPending || updateMeetingMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        createMeetingMutation.isPending ||
                        updateMeetingMutation.isPending ||
                        selectedMeetingEmployeeId.length === 0
                      }
                    >
                      {(createMeetingMutation.isPending ||
                        updateMeetingMutation.isPending) && (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      )}
                      {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Side (1 column) */}
        <div className="space-y-6">
          {/* Lead Details */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                Lead Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.category && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Category</label>
                  <p className="mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      {lead.category.name}
                    </span>
                  </p>
                </div>
              )}
              {lead.interest && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Interest</label>
                  <p className="mt-1">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                      {lead.interest.name}
                    </span>
                  </p>
                </div>
              )}
              {lead.value && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Estimated Value</label>
                  <p className="mt-1 text-slate-900 font-medium text-lg">
                    {formatCurrency(lead.value)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.assignments && lead.assignments.length > 0 ? (
                <div className="space-y-3">
                  {lead.assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-gray-200 bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        {a.employee?.user?.profileImage ? (
                          <img
                            src={a.employee.user.profileImage}
                            alt={a.employee.user.email}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                            {a.employee?.user?.email?.charAt(0).toUpperCase() || 'E'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {a.employee?.user?.email || 'Employee'}
                          </p>
                          {a.employee?.user?.role && (
                            <p className="text-xs text-slate-500">{a.employee.user.role.name}</p>
                          )}
                        </div>
                      </div>
                      {user?.companyId && (user?.roleName === 'Lead Manager' || user?.roleName === 'SuperAdmin' || hasPermission?.('can_manage_leads')) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeAssignmentMutation.mutate(a.employeeId)}
                          disabled={removeAssignmentMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Not assigned</p>
              )}
              {user?.companyId && (user?.roleName === 'Lead Manager' || user?.roleName === 'SuperAdmin' || hasPermission?.('can_manage_leads')) && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-slate-600 mb-2">অ্যাসাইন যোগ করুন</p>
                  <EmployeeSelector
                    companyId={user.companyId}
                    selectedEmployeeIds={leadAssignmentsSelectedIds}
                    onSelectionChange={setLeadAssignmentsSelectedIds}
                  />
                  <Button
                    size="sm"
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700"
                    disabled={assignUsersMutation.isPending || leadAssignmentsSelectedIds.length === 0}
                    onClick={() => assignUsersMutation.mutate(leadAssignmentsSelectedIds)}
                  >
                    {assignUsersMutation.isPending ? 'যোগ করা হচ্ছে...' : 'যোগ করুন'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Created By */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Created By
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.createdByUser ? (
                <div className="flex items-center gap-3">
                  {lead.createdByUser.profileImage ? (
                    <img
                      src={lead.createdByUser.profileImage}
                      alt={lead.createdByUser.email}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {lead.createdByUser.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {lead.createdByUser.name || lead.createdByUser.email}
                    </p>
                    <p className="text-xs text-slate-500">{lead.createdByUser.email}</p>
                    {lead.createdByUser.role && (
                      <p className="text-xs text-slate-500 mt-1">
                        {lead.createdByUser.role.name}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Unknown</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Created At</label>
                <p className="mt-1 text-sm text-slate-700">{formatDate(lead.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Last Updated</label>
                <p className="mt-1 text-sm text-slate-700">{formatDate(lead.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Call Schedule */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-indigo-600" />
                  Call Schedule
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openCreateCallForm}
                  disabled={isCallFormOpen}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Schedule Call
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCalls ? (
                <div className="text-center py-4 text-slate-500 text-sm">Loading calls...</div>
              ) : calls.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">
                  No calls scheduled
                </div>
              ) : (
                <div className="space-y-3">
                  {calls.map((call) => (
                    <div
                      key={call.id}
                      className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          {call.title && (
                            <span className="font-medium text-slate-900">{call.title}</span>
                          )}
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getCallStatusColor(call.status))}>
                            {call.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatMeetingDate(call.callTime)}</span>
                          {call.durationMinutes && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span>{call.durationMinutes} min</span>
                            </>
                          )}
                        </div>
                        {call.phoneNumber && (
                          <div className="text-sm text-slate-600 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{call.phoneNumber}</span>
                          </div>
                        )}
                        {call.assignedEmployee && (
                          <div className="text-sm text-slate-600 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{call.assignedEmployee.user?.email || 'Employee'}</span>
                          </div>
                        )}
                        {call.notes && (
                          <div className="text-sm text-slate-700 mt-2 p-2 bg-gray-50 rounded">
                            <strong>Notes:</strong> {call.notes}
                          </div>
                        )}
                        {editingCallNote?.callId === call.id && (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={editingCallNote.note}
                              onChange={(e) => setEditingCallNote({ callId: call.id, note: e.target.value })}
                              placeholder="Add call notes..."
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCallNote(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          {!editingCallNote || editingCallNote.callId !== call.id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCallNote({ callId: call.id, note: call.notes || '' })}
                              title="Add note"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCallForm(call)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteCallMutation.mutate(call.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isCallFormOpen && (
                <form
                  onSubmit={handleCallSubmit(onCallSubmit)}
                  className="mt-4 space-y-4 border-t pt-4"
                >
                  <div>
                    <label className="text-sm font-medium text-slate-600">Title (Optional)</label>
                    <Input
                      {...registerCall('title')}
                      className="mt-1"
                      placeholder="Call title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Phone Number</label>
                    <Input
                      {...registerCall('phoneNumber')}
                      className="mt-1"
                      placeholder={lead?.phone || 'Phone number'}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Call Time *</label>
                    <Input
                      type="datetime-local"
                      {...registerCall('callTime')}
                      className="mt-1"
                    />
                    {callErrors.callTime && (
                      <p className="text-xs text-red-500 mt-1">{callErrors.callTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Duration (minutes, optional)</label>
                    <Input
                      type="number"
                      {...registerCall('durationMinutes', { valueAsNumber: true })}
                      className="mt-1"
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Assigned To *</label>
                    {user?.companyId && (
                      <EmployeeSelector
                        companyId={user.companyId}
                        selectedEmployeeIds={selectedEmployeeId}
                        onSelectionChange={setSelectedEmployeeId}
                        disabledEmployeeIds={busyEmployeeIdsCall}
                        disabledReasonByEmployeeId={Object.fromEntries(
                          busyEmployeeIdsCall.map((id) => [id, 'Booked'])
                        )}
                      />
                    )}
                    {callErrors.assignedTo && (
                      <p className="text-xs text-red-500 mt-1">{callErrors.assignedTo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Status</label>
                    <select
                      {...registerCall('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
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
                      variant="outline"
                      onClick={() => {
                        setIsCallFormOpen(false);
                        setEditingCall(null);
                        setSelectedEmployeeId([]);
                        resetCall();
                      }}
                      disabled={isCallSubmitting || createCallMutation.isPending || updateCallMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isCallSubmitting ||
                        createCallMutation.isPending ||
                        updateCallMutation.isPending ||
                        selectedEmployeeId.length === 0
                      }
                    >
                      {(createCallMutation.isPending || updateCallMutation.isPending) && (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      )}
                      {editingCall ? 'Update Call' : 'Schedule Call'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Convert to Client Modal */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md shadow-lg border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  Convert Lead to Client
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConvertSubmit(onConvertSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Client Name</label>
                  <Input
                    {...registerConvert('name')}
                    className="mt-1"
                    placeholder={lead?.customerName || lead?.title || 'Client name'}
                  />
                  {convertErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{convertErrors.name.message}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Leave empty to use lead title: {lead?.title}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">ইমেইল * (লগইনের জন্য)</label>
                  <Input
                    type="email"
                    {...registerConvert('email')}
                    className="mt-1"
                    placeholder="client@example.com"
                  />
                  {convertErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{convertErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">Phone (Optional)</label>
                  <Input
                    {...registerConvert('phone')}
                    className="mt-1"
                    placeholder={lead?.phone || 'Phone number'}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">পাসওয়ার্ড * (ক্লায়েন্ট লগইনের জন্য)</label>
                  <Input
                    type="password"
                    {...registerConvert('password')}
                    className="mt-1"
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    autoComplete="new-password"
                  />
                  {convertErrors.password && (
                    <p className="text-xs text-red-500 mt-1">{convertErrors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">পাসওয়ার্ড নিশ্চিত করুন *</label>
                  <Input
                    type="password"
                    {...registerConvert('confirmPassword')}
                    className="mt-1"
                    placeholder="পাসওয়ার্ড আবার লিখুন"
                    autoComplete="new-password"
                  />
                  {convertErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{convertErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">Address (Optional)</label>
                  <Textarea
                    {...registerConvert('address')}
                    className="mt-1"
                    rows={3}
                    placeholder="Client address"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    disabled={convertToClientMutation.isPending}
                  >
                    {convertToClientMutation.isPending && (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    )}
                    Convert to Client
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConvertModalOpen(false)}
                    disabled={convertToClientMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Change Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md shadow-lg border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  স্ট্যাটাস পরিবর্তন করুন
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  বর্তমান স্ট্যাটাস: <span className={cn("px-2 py-1 rounded text-xs font-medium", getStatusColor(lead.status))}>{lead.status}</span>
                </p>
                
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        selectedStatus === option.value
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50",
                        lead.status === option.value && "opacity-50"
                      )}
                      disabled={lead.status === option.value}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("px-2 py-1 rounded text-sm font-medium", option.color)}>
                          {option.label}
                        </span>
                        {lead.status === option.value && (
                          <span className="text-xs text-slate-500">(বর্তমান)</span>
                        )}
                        {selectedStatus === option.value && lead.status !== option.value && (
                          <CheckCircle className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      {option.value === 'Won' && lead.status !== 'Won' && (
                        <p className="text-xs text-green-600 mt-2">
                          ✨ এই স্ট্যাটাস সিলেক্ট করলে রিজার্ভ পয়েন্ট মেইন পয়েন্টে ট্রান্সফার হবে
                        </p>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleStatusUpdate}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    disabled={updateStatusMutation.isPending || selectedStatus === lead.status}
                  >
                    {updateStatusMutation.isPending && (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    )}
                    স্ট্যাটাস আপডেট করুন
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsStatusModalOpen(false)}
                    disabled={updateStatusMutation.isPending}
                  >
                    বাতিল
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer Monitoring Modal */}
      {isTransferMonitoringModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md shadow-lg border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Transfer Monitoring
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsTransferMonitoringModalOpen(false);
                    setNewLeadManagerUserId('');
                  }}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Select new Lead Manager</label>
                <select
                  className="mt-2 w-full border border-gray-200 rounded-md p-2 text-sm"
                  value={newLeadManagerUserId}
                  onChange={(e) => setNewLeadManagerUserId(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {leadManagers
                    .filter((m) => m.id !== user?.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name ? `${m.name} (${m.email})` : m.email}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Only the current monitoring incharge can transfer this responsibility to another Lead Manager.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={transferMonitoringMutation.isPending || !newLeadManagerUserId}
                  onClick={() => transferMonitoringMutation.mutate()}
                >
                  {transferMonitoringMutation.isPending && (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  )}
                  Transfer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsTransferMonitoringModalOpen(false);
                    setNewLeadManagerUserId('');
                  }}
                  disabled={transferMonitoringMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

