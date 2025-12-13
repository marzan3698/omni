import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, FileText, Target, Users, TrendingUp, Calendar, DollarSign, Clock, Building2, User, Phone, Mail, Package, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectDetailModalProps {
  projectId: number | null;
  onClose: () => void;
}

interface ProjectDetailData {
  id: number;
  title: string;
  description?: string;
  budget: number;
  time: string;
  status: string;
  deliveryStartDate?: string;
  deliveryEndDate?: string;
  signature?: string;
  signedAt?: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
  company: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  client: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  service?: {
    id: number;
    title: string;
    details: string;
    pricing: number;
    deliveryStartDate: string;
    deliveryEndDate: string;
  };
  invoices: Array<{
    id: number;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    status: string;
    notes?: string;
    items: Array<any>;
  }>;
  payments: Array<{
    id: number;
    amount: number;
    transactionId?: string;
    paymentMethod: string;
    status: string;
    paidBy?: string;
    paidAt?: string;
    verifiedAt?: string;
    notes?: string;
    adminNotes?: string;
    paymentGateway?: {
      id: number;
      name: string;
      accountType: string;
    };
  }>;
  campaigns: Array<{
    id: number;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    budget: number;
    type: string;
    isActive: boolean;
    leads: Array<any>;
    employeeGroups: Array<{
      id: number;
      name: string;
      description?: string;
      members: Array<{
        id: number;
        userId: string;
        designation?: string;
        department?: string;
        user: {
          id: string;
          name?: string;
          email: string;
          phone?: string;
        };
      }>;
    }>;
    products: Array<any>;
  }>;
  stats: {
    totalInvoices: number;
    totalPayments: number;
    totalCampaigns: number;
    totalLeads: number;
    totalEmployees: number;
  };
}

export function ProjectDetailModal({ projectId, onClose }: ProjectDetailModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await adminApi.getProjectById(projectId);
      return response.data.data as ProjectDetailData;
    },
    enabled: !!projectId,
  });

  if (!projectId) return null;

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'InProgress':
        return 'bg-blue-100 text-blue-700';
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-700';
      case 'StartedWorking':
        return 'bg-purple-100 text-purple-700';
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Unpaid':
        return 'bg-yellow-100 text-yellow-700';
      case 'Overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCampaignTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sale':
        return 'bg-green-100 text-green-700';
      case 'reach':
        return 'bg-blue-100 text-blue-700';
      case 'research':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'Won':
        return 'bg-green-100 text-green-700';
      case 'Lost':
        return 'bg-red-100 text-red-700';
      case 'New':
        return 'bg-blue-100 text-blue-700';
      case 'Negotiation':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col z-50 m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-900">
            Project Details: {isLoading ? 'Loading...' : data?.title || 'Unknown'}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
              <p className="mt-4 text-slate-600">Loading project details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load project details</p>
            </div>
          ) : !data ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Project not found</p>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{data.stats.totalInvoices}</p>
                        <p className="text-sm text-slate-600">Invoices</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{data.stats.totalPayments}</p>
                        <p className="text-sm text-slate-600">Payments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Target className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{data.stats.totalCampaigns}</p>
                        <p className="text-sm text-slate-600">Campaigns</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{data.stats.totalLeads}</p>
                        <p className="text-sm text-slate-600">Leads</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-semibold text-slate-700 mb-1">Title</dt>
                      <dd className="text-slate-900">{data.title}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-slate-700 mb-1">Status</dt>
                      <dd>
                        <Badge className={getProjectStatusColor(data.status)}>
                          {data.status}
                        </Badge>
                      </dd>
                    </div>
                    {data.description && (
                      <div className="md:col-span-2">
                        <dt className="text-sm font-semibold text-slate-700 mb-1">Description</dt>
                        <dd className="text-slate-900">{data.description}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Budget
                      </dt>
                      <dd className="text-slate-900">${Number(data.budget).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Time
                      </dt>
                      <dd className="text-slate-900">{data.time}</dd>
                    </div>
                    {data.deliveryStartDate && (
                      <div>
                        <dt className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Delivery Start
                        </dt>
                        <dd className="text-slate-900">{new Date(data.deliveryStartDate).toLocaleDateString()}</dd>
                      </div>
                    )}
                    {data.deliveryEndDate && (
                      <div>
                        <dt className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Delivery End
                        </dt>
                        <dd className="text-slate-900">{new Date(data.deliveryEndDate).toLocaleDateString()}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-semibold text-slate-700 mb-1">Name</dt>
                      <dd className="text-slate-900">{data.client.name || data.client.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </dt>
                      <dd className="text-slate-900">{data.client.email}</dd>
                    </div>
                    {data.client.phone && (
                      <div>
                        <dt className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          Phone
                        </dt>
                        <dd className="text-slate-900">{data.client.phone}</dd>
                      </div>
                    )}
                  </div>

                  {/* Client Signature */}
                  {data.signature && (
                    <div className="mt-4 pt-4 border-t">
                      <dt className="text-sm font-semibold text-slate-700 mb-2">Client Signature</dt>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <img
                          src={data.signature}
                          alt="Client Signature"
                          className="max-w-full h-auto max-h-32 mx-auto"
                        />
                        {data.signedAt && (
                          <p className="text-xs text-slate-500 text-center mt-2">
                            Signed: {new Date(data.signedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Information */}
              {data.service && (
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Service Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-semibold text-slate-700 mb-1">Service Title</dt>
                        <dd className="text-slate-900">{data.service.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Pricing
                        </dt>
                        <dd className="text-slate-900">${Number(data.service.pricing).toLocaleString()}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-sm font-semibold text-slate-700 mb-1">Details</dt>
                        <dd className="text-slate-900">{data.service.details}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              )}

              {/* Invoices */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoices ({data.invoices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.invoices.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No invoices found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-sm font-semibold">Invoice #</th>
                            <th className="text-left p-2 text-sm font-semibold">Issue Date</th>
                            <th className="text-left p-2 text-sm font-semibold">Due Date</th>
                            <th className="text-left p-2 text-sm font-semibold">Amount</th>
                            <th className="text-left p-2 text-sm font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">{invoice.invoiceNumber}</td>
                              <td className="p-2">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                              <td className="p-2">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                              <td className="p-2">${Number(invoice.totalAmount).toLocaleString()}</td>
                              <td className="p-2">
                                <Badge className={getInvoiceStatusColor(invoice.status)}>
                                  {invoice.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payments */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payments ({data.payments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.payments.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No payments found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-sm font-semibold">Amount</th>
                            <th className="text-left p-2 text-sm font-semibold">Method</th>
                            <th className="text-left p-2 text-sm font-semibold">Gateway</th>
                            <th className="text-left p-2 text-sm font-semibold">Transaction ID</th>
                            <th className="text-left p-2 text-sm font-semibold">Status</th>
                            <th className="text-left p-2 text-sm font-semibold">Paid At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.payments.map((payment) => (
                            <tr key={payment.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">${Number(payment.amount).toLocaleString()}</td>
                              <td className="p-2">{payment.paymentMethod}</td>
                              <td className="p-2">{payment.paymentGateway?.name || 'N/A'}</td>
                              <td className="p-2">{payment.transactionId || 'N/A'}</td>
                              <td className="p-2">
                                <Badge className={getPaymentStatusColor(payment.status)}>
                                  {payment.status}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaigns */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Connected Campaigns ({data.campaigns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.campaigns.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No campaigns found</p>
                  ) : (
                    <div className="space-y-4">
                      {data.campaigns.map((campaign) => (
                        <Card key={campaign.id} className="border-gray-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                                {campaign.description && (
                                  <p className="text-sm text-slate-600 mt-1">{campaign.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Badge className={getCampaignTypeColor(campaign.type)}>
                                  {campaign.type}
                                </Badge>
                                {campaign.isActive ? (
                                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <dt className="text-slate-600 mb-1 flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Start Date
                                </dt>
                                <dd className="font-semibold">{new Date(campaign.startDate).toLocaleDateString()}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-600 mb-1 flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  End Date
                                </dt>
                                <dd className="font-semibold">{new Date(campaign.endDate).toLocaleDateString()}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-600 mb-1 flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  Budget
                                </dt>
                                <dd className="font-semibold">${Number(campaign.budget).toLocaleString()}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-600 mb-1 flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4" />
                                  Leads
                                </dt>
                                <dd className="font-semibold">{campaign.leads.length}</dd>
                              </div>
                            </div>

                            {campaign.leads.length > 0 && (
                              <div>
                                <dt className="text-sm font-semibold text-slate-700 mb-2">Leads ({campaign.leads.length})</dt>
                                <div className="space-y-2">
                                  {campaign.leads.slice(0, 5).map((lead: any) => (
                                    <div key={lead.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                      <div>
                                        <p className="font-medium text-sm">{lead.title}</p>
                                        {lead.customerName && (
                                          <p className="text-xs text-slate-600">{lead.customerName}</p>
                                        )}
                                      </div>
                                      <Badge className={getLeadStatusColor(lead.status)}>
                                        {lead.status}
                                      </Badge>
                                    </div>
                                  ))}
                                  {campaign.leads.length > 5 && (
                                    <p className="text-xs text-slate-500 text-center">
                                      +{campaign.leads.length - 5} more leads
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {campaign.employeeGroups.length > 0 && (
                              <div>
                                <dt className="text-sm font-semibold text-slate-700 mb-2">Employee Groups</dt>
                                <div className="flex flex-wrap gap-2">
                                  {campaign.employeeGroups.map((group) => (
                                    <Badge key={group.id} variant="outline">
                                      {group.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

