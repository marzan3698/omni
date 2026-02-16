import { useState } from 'react';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { Button } from '@/components/ui/button';
import {
  FileText, Target, TrendingUp, Calendar, DollarSign, Clock, User, Phone, Mail, Package, CreditCard, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddInvoiceToProjectModal } from './AddInvoiceToProjectModal';
import { AddPaymentToProjectModal } from './AddPaymentToProjectModal';
import { formatCurrencyWithSymbol, formatDaysToMonthsDays } from '@/lib/utils';
import {
  getProjectStatusColor,
  getInvoiceStatusColor,
  getPaymentStatusColor,
  getCampaignTypeColor,
  getLeadStatusColor,
  btnOutline,
} from '@/lib/projectDetailUtils';

export interface ProjectDetailData {
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
  company: { id: number; name: string; email?: string; phone?: string; address?: string };
  client: { id: string; name?: string; email: string; phone?: string; profileImage?: string };
  service?: {
    id: number; title: string; details: string; pricing: number; currency?: string;
    useDeliveryDate?: boolean; durationDays?: number; deliveryStartDate?: string; deliveryEndDate?: string;
  };
  invoices: Array<{ id: number; invoiceNumber: string; issueDate: string; dueDate: string; totalAmount: number; status: string; notes?: string; items: Array<any> }>;
  payments: Array<{
    id: number; amount: number; transactionId?: string; paymentMethod: string; status: string;
    paidBy?: string; paidAt?: string; verifiedAt?: string; notes?: string; adminNotes?: string;
    paymentGateway?: { id: number; name: string; accountType: string };
  }>;
  campaigns: Array<{
    id: number; name: string; description?: string; startDate: string; endDate: string; budget: number;
    type: string; isActive: boolean; leads: Array<any>;
    employeeGroups?: Array<{ id: number; name: string; description?: string; members: Array<any> }>;
  }>;
  products: Array<any>;
  stats: { totalInvoices: number; totalPayments: number; totalCampaigns: number; totalLeads: number; totalEmployees: number };
}

interface ProjectDetailContentProps {
  data: ProjectDetailData;
  projectId: number;
}

export function ProjectDetailContent({ data, projectId }: ProjectDetailContentProps) {
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GameCard index={0} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Invoices</p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{data.stats.totalInvoices}</p>
            </div>
            <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10">
              <FileText className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={1} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Payments</p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{data.stats.totalPayments}</p>
            </div>
            <div className="p-3 rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <CreditCard className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={2} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Campaigns</p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{data.stats.totalCampaigns}</p>
            </div>
            <div className="p-3 rounded-full border border-purple-500/30 bg-purple-500/10">
              <Target className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={3} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Leads</p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{data.stats.totalLeads}</p>
            </div>
            <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </GameCard>
      </div>

      <GamePanel>
        <div className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
            <FileText className="h-5 w-5 text-amber-400" /> Project Information
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1">Title</dt>
              <dd className="text-amber-100">{data.title}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1">Status</dt>
              <dd>
                <span className={cn('px-2 py-1 rounded border text-sm font-medium', getProjectStatusColor(data.status))}>{data.status}</span>
              </dd>
            </div>
            {data.description && (
              <div className="md:col-span-2">
                <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1">Description</dt>
                <dd className="text-amber-200/90">{data.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1 flex items-center gap-1"><DollarSign className="h-4 w-4" /> Budget</dt>
              <dd className="text-amber-100">{formatCurrencyWithSymbol(data.budget, 'BDT')}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="h-4 w-4" /> Time</dt>
              <dd className="text-amber-100">{data.time}</dd>
            </div>
            {data.deliveryStartDate && (
              <div>
                <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="h-4 w-4" /> Delivery Start</dt>
                <dd className="text-amber-200/90">{new Date(data.deliveryStartDate).toLocaleDateString()}</dd>
              </div>
            )}
            {data.deliveryEndDate && (
              <div>
                <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="h-4 w-4" /> Delivery End</dt>
                <dd className="text-amber-200/90">{new Date(data.deliveryEndDate).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </div>
      </GamePanel>

      <GamePanel>
        <div className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
            <User className="h-5 w-5 text-amber-400" /> Client Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1">Name</dt>
              <dd className="text-amber-100">{data.client.name || data.client.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1 flex items-center gap-1"><Mail className="h-4 w-4" /> Email</dt>
              <dd className="text-amber-100">{data.client.email}</dd>
            </div>
            {data.client.phone && (
              <div>
                <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1 flex items-center gap-1"><Phone className="h-4 w-4" /> Phone</dt>
                <dd className="text-amber-100">{data.client.phone}</dd>
              </div>
            )}
          </div>
          {data.signature && (
            <div className="mt-4 pt-4 border-t border-amber-500/20">
              <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-2">Client Signature</dt>
              <div className="bg-slate-800/60 p-4 rounded-lg border border-amber-500/20">
                <img src={data.signature} alt="Client Signature" className="max-w-full h-auto max-h-32 mx-auto" />
                {data.signedAt && <p className="text-xs text-amber-200/60 text-center mt-2">Signed: {new Date(data.signedAt).toLocaleString()}</p>}
              </div>
            </div>
          )}
        </div>
      </GamePanel>

      {data.service && (
        <GamePanel>
          <div className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
              <Package className="h-5 w-5 text-amber-400" /> Service Information
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1">Service Title</dt>
                <dd className="text-amber-100">{data.service.title}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1 flex items-center gap-1"><DollarSign className="h-4 w-4" /> Pricing</dt>
                <dd className="text-amber-100">{formatCurrencyWithSymbol(data.service.pricing, data.service.currency || 'BDT')}</dd>
              </div>
              {(data.service.useDeliveryDate && data.service.deliveryStartDate && data.service.deliveryEndDate) || data.service.durationDays ? (
                <div>
                  <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1">মেয়াদ</dt>
                  <dd className="text-amber-200/90">
                    {data.service.useDeliveryDate && data.service.deliveryStartDate && data.service.deliveryEndDate
                      ? `${new Date(data.service.deliveryStartDate).toLocaleDateString()} – ${new Date(data.service.deliveryEndDate).toLocaleDateString()}`
                      : data.service.durationDays ? formatDaysToMonthsDays(data.service.durationDays) : '-'}
                  </dd>
                </div>
              ) : null}
              <div className="md:col-span-2">
                <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-1">Details</dt>
                <dd className="text-amber-200/90">{data.service.details}</dd>
              </div>
            </dl>
          </div>
        </GamePanel>
      )}

      <GamePanel>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
              <FileText className="h-5 w-5 text-amber-400" /> Invoices ({data.invoices.length})
            </h3>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white" onClick={() => setShowAddInvoice(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Invoice
            </Button>
          </div>
          {data.invoices.length === 0 ? (
            <p className="text-amber-200/60 text-center py-4">No invoices found</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-amber-500/20">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/20 bg-slate-800/60">
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Invoice #</th>
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Issue Date</th>
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Due Date</th>
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Amount</th>
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                      <td className="p-3 text-amber-100">{invoice.invoiceNumber}</td>
                      <td className="p-3 text-amber-200/90">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                      <td className="p-3 text-amber-200/90">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                      <td className="p-3 text-amber-100">{formatCurrencyWithSymbol(invoice.totalAmount, 'BDT')}</td>
                      <td className="p-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getInvoiceStatusColor(invoice.status))}>{invoice.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GamePanel>

      <GamePanel>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
              <CreditCard className="h-5 w-5 text-amber-400" /> Payments ({data.payments.length})
            </h3>
            <Button size="sm" className={btnOutline} onClick={() => setShowAddPayment(true)} disabled={data.invoices.length === 0}>
              <Plus className="w-4 h-4 mr-1" /> Add Payment
            </Button>
          </div>
          {data.payments.length === 0 ? (
            <p className="text-amber-200/60 text-center py-4">No payments found</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-amber-500/20">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/20 bg-slate-800/60">
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Amount</th>
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Method</th>
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Gateway</th>
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Transaction ID</th>
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-amber-200/70 uppercase tracking-wider">Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                      <td className="p-3 text-amber-100">{formatCurrencyWithSymbol(payment.amount, 'BDT')}</td>
                      <td className="p-3 text-amber-200/90">{payment.paymentMethod}</td>
                      <td className="p-3 text-amber-200/90">{payment.paymentGateway?.name || 'N/A'}</td>
                      <td className="p-3 text-amber-200/90">{payment.transactionId || 'N/A'}</td>
                      <td className="p-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getPaymentStatusColor(payment.status))}>{payment.status}</span>
                      </td>
                      <td className="p-3 text-amber-200/90">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GamePanel>

      <GamePanel>
        <div className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100 mb-4">
            <Target className="h-5 w-5 text-amber-400" /> Connected Campaigns ({data.campaigns.length})
          </h3>
          {data.campaigns.length === 0 ? (
            <p className="text-amber-200/60 text-center py-4">No campaigns found</p>
          ) : (
            <div className="space-y-4">
              {data.campaigns.map((campaign, idx) => (
                <GameCard key={campaign.id} index={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-amber-100">{campaign.name}</h4>
                        {campaign.description && <p className="text-sm text-amber-200/80 mt-1">{campaign.description}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getCampaignTypeColor(campaign.type))}>{campaign.type}</span>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', campaign.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-700/60 text-amber-200/80 border-amber-500/20')}>
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <dt className="text-xs text-amber-200/70 mb-1 flex items-center gap-1"><Calendar className="h-4 w-4" /> Start</dt>
                        <dd className="font-medium text-amber-100">{new Date(campaign.startDate).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-amber-200/70 mb-1 flex items-center gap-1"><Calendar className="h-4 w-4" /> End</dt>
                        <dd className="font-medium text-amber-100">{new Date(campaign.endDate).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-amber-200/70 mb-1 flex items-center gap-1"><DollarSign className="h-4 w-4" /> Budget</dt>
                        <dd className="font-medium text-amber-100">{formatCurrencyWithSymbol(campaign.budget, 'BDT')}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-amber-200/70 mb-1 flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Leads</dt>
                        <dd className="font-medium text-amber-100">{campaign.leads.length}</dd>
                      </div>
                    </div>
                    {campaign.leads.length > 0 && (
                      <div>
                        <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-2">Leads ({campaign.leads.length})</dt>
                        <div className="space-y-2">
                          {campaign.leads.slice(0, 5).map((lead: any) => (
                            <div key={lead.id} className="flex items-center justify-between p-2 bg-slate-800/60 rounded border border-amber-500/20">
                              <div>
                                <p className="font-medium text-sm text-amber-100">{lead.title}</p>
                                {lead.customerName && <p className="text-xs text-amber-200/70">{lead.customerName}</p>}
                              </div>
                              <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getLeadStatusColor(lead.status))}>{lead.status}</span>
                            </div>
                          ))}
                          {campaign.leads.length > 5 && <p className="text-xs text-amber-200/60 text-center">+{campaign.leads.length - 5} more</p>}
                        </div>
                      </div>
                    )}
                    {campaign.employeeGroups?.length > 0 && (
                      <div>
                        <dt className="text-xs font-medium text-amber-200/70 uppercase tracking-wider mb-2">Employee Groups</dt>
                        <div className="flex flex-wrap gap-2">
                          {campaign.employeeGroups.map((group: any) => (
                            <span key={group.id} className="px-2 py-1 rounded border border-amber-500/30 text-amber-200 text-xs">{group.name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </GameCard>
              ))}
            </div>
          )}
        </div>
      </GamePanel>

      {showAddInvoice && (
        <AddInvoiceToProjectModal projectId={projectId} clientName={data.client?.name || data.client?.email} onClose={() => setShowAddInvoice(false)} />
      )}
      {showAddPayment && (
        <AddPaymentToProjectModal projectId={projectId} invoices={data.invoices} onClose={() => setShowAddPayment(false)} />
      )}
    </>
  );
}
