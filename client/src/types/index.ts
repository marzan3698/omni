// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  roleId: number;
  roleName?: string;
  profileImage?: string;
  permissions?: Record<string, boolean>;
  companyId?: number;
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  roleId?: number;
  companyId: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Task types
export type TaskStatus = 'Pending' | 'StartedWorking' | 'Complete' | 'Cancel';
export type SubTaskStatus = 'Pending' | 'StartedWorking' | 'Complete' | 'Cancel';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type AttachmentFileType = 'image' | 'pdf' | 'video' | 'audio' | 'link';
export type TaskMessageType = 'text' | 'image' | 'file' | 'audio' | 'system';

export interface SubTask {
  id: number;
  taskId: number;
  companyId: number;
  title: string;
  instructions?: string | null;
  weight: number;
  status: SubTaskStatus;
  order: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id: number;
  taskId?: number | null;
  subTaskId?: number | null;
  companyId: number;
  fileType: AttachmentFileType;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkDescription?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string | null;
    email: string;
    profileImage?: string | null;
  };
}

export interface TaskMessage {
  id: number;
  conversationId: number;
  senderId: string;
  content?: string | null;
  messageType: TaskMessageType;
  attachmentId?: number | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  attachment?: TaskAttachment;
}

export interface TaskConversation {
  id: number;
  taskId: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  messages?: TaskMessage[];
}

export interface Task {
  id: number;
  companyId: number;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId?: number | null;
  assignedTo?: number | null;
  groupId?: number | null;
  status: TaskStatus;
  startedAt?: string | null;
  progress: number;
  conversationId?: number | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: number; title: string; status: string };
  assignedEmployee?: { user?: User };
  group?: { id: number; name: string; description: string; members?: { employee: { user: User } }[] };
  comments?: any[];
  subTasks?: SubTask[];
  attachments?: TaskAttachment[];
  conversation?: TaskConversation;
  _count?: {
    comments: number;
    subTasks: number;
    attachments: number;
  };
  unreadMessageCount?: number;
}

// Lead types
export interface LeadAssignment {
  id: number;
  leadId: number;
  employeeId: number;
  assignedAt: string;
  employee: {
    id: number;
    user?: {
      id: string;
      email: string;
      profileImage?: string | null;
      role?: { id: number; name: string };
    };
  };
}

export interface Lead {
  id: number;
  companyId: number;
  createdBy: string;
  title: string;
  description?: string | null;
  source: string;
  status: string;
  value?: number | string | null;
  conversationId?: number | null;
  customerName?: string | null;
  phone?: string | null;
  categoryId?: number | null;
  interestId?: number | null;
  campaignId?: number | null;
  productId?: number | null;
  purchasePrice?: number | string | null;
  salePrice?: number | string | null;
  profit?: number | string | null;
  convertedToClientId?: number | null;
  leadMonitoringUserId?: string | null;
  leadMonitoringAssignedAt?: string | null;
  leadMonitoringTransferredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser?: { id: string; email?: string; profileImage?: string | null; name?: string | null; role?: { id: number; name: string } };
  leadMonitoringUser?: { id: string; name?: string | null; email: string; profileImage?: string | null; role?: { id: number; name: string } } | null;
  clientApprovalRequest?: {
    id: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    approvedAt?: string | null;
    client?: { id: number; name: string; status: string };
    approvedByUser?: { id: string; name?: string | null; email: string } | null;
  } | null;
  assignments?: LeadAssignment[];
  conversation?: unknown;
  category?: { id: number; name: string } | null;
  interest?: { id: number; name: string } | null;
  campaign?: unknown;
  product?: unknown;
}

// Lead Meeting types
export type LeadMeetingStatus = 'Scheduled' | 'Completed' | 'Canceled';

export interface LeadMeeting {
  id: number;
  companyId: number;
  leadId: number;
  clientId?: number | null;
  assignedTo: number;
  createdBy: string;
  title: string;
  description?: string | null;
  meetingTime: string;
  durationMinutes: number;
  googleMeetUrl: string;
  status: LeadMeetingStatus;
  createdAt: string;
  updatedAt: string;
  assignedEmployee?: {
    id: number;
    user?: {
      id: string;
      email: string;
      name?: string | null;
      profileImage?: string | null;
    };
  };
}

// Lead Call types
export type LeadCallStatus = 'Scheduled' | 'Completed' | 'Canceled' | 'NoAnswer' | 'Busy' | 'LeftVoicemail';

export interface LeadCall {
  id: number;
  companyId: number;
  leadId: number;
  clientId?: number | null;
  assignedTo: number;
  createdBy: string;
  title?: string | null;
  phoneNumber?: string | null;
  callTime: string | Date;
  durationMinutes?: number | null;
  status: LeadCallStatus;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  assignedEmployee?: {
    id: number;
    user?: {
      id: string;
      email: string;
      name?: string | null;
      profileImage?: string | null;
    };
    designation?: string | null;
    department?: string | null;
  };
  lead?: {
    id: number;
    title: string;
    phone?: string | null;
  };
  client?: {
    id: number;
    name: string;
  };
}

