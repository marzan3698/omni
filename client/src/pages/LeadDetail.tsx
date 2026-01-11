import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { leadApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id, user?.companyId],
    queryFn: async () => {
      if (!id || !user?.companyId) throw new Error('Invalid parameters');
      const response = await leadApi.getById(parseInt(id), user.companyId);
      return response.data.data;
    },
    enabled: !!id && !!user?.companyId,
  });

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
          <span className={cn(
            "px-4 py-2 rounded-lg border flex items-center gap-2 font-medium text-sm",
            getStatusColor(lead.status)
          )}>
            {getStatusIcon(lead.status)}
            {lead.status}
          </span>
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
                            src={message.imageUrl.startsWith('http') 
                              ? message.imageUrl 
                              : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${message.imageUrl}`}
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
              {lead.assignedEmployee ? (
                <div className="flex items-center gap-3">
                  {lead.assignedEmployee.user?.profileImage ? (
                    <img
                      src={lead.assignedEmployee.user.profileImage}
                      alt={lead.assignedEmployee.user.email}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {lead.assignedEmployee.user?.email?.charAt(0).toUpperCase() || 'E'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {lead.assignedEmployee.user?.email || 'Employee'}
                    </p>
                    {lead.assignedEmployee.user?.role && (
                      <p className="text-xs text-slate-500">{lead.assignedEmployee.user.role.name}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Not assigned</p>
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
        </div>
      </div>
    </div>
  );
}

