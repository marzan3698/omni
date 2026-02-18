import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { ClientJourneyTimeline } from '@/components/ClientJourneyTimeline';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Target,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const btnOutline =
  'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';

function getInvoiceStatusStyle(status: string) {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'Unpaid':
      return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    case 'Overdue':
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    default:
      return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
  }
}

function getCampaignTypeStyle(type: string) {
  switch (type.toLowerCase()) {
    case 'sale':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'reach':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'research':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    default:
      return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
  }
}

export function ClientJourneyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await adminApi.getClientById(Number(id));
      return response.data.data as any;
    },
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="p-6 text-amber-200/80">Invalid client ID</div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <GamePanel className="p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-amber-500/50 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-amber-200/80">Loading client journey...</p>
          </div>
        </GamePanel>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <GamePanel className="p-12">
          <p className="text-red-400 text-center">Failed to load client details</p>
          <Button className={cn('mt-4 mx-auto', btnOutline)} onClick={() => navigate('/admin/projects-clients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </GamePanel>
      </div>
    );
  }

  const contactInfo = data.contactInfo || {};
  const phone = contactInfo.phone || contactInfo.Phone || '';
  const email = contactInfo.email || contactInfo.Email || '';
  const companyName = data.company?.name || 'Company';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <GamePanel className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button
              size="sm"
              onClick={() => navigate('/admin/projects-clients')}
              className={cn('mb-2 -ml-2', btnOutline)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-100 flex items-center gap-3">
              {data.name}
            </h1>
            <p className="text-amber-200/80 mt-1">{companyName} - Journey Timeline</p>
          </div>
        </div>
      </GamePanel>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GameCard index={0} className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <FileText className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-100">{data.stats?.totalInvoices ?? 0}</p>
              <p className="text-xs text-amber-200/70">Invoices</p>
            </div>
          </div>
        </GameCard>
        <GameCard index={1} className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <Target className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-100">{data.stats?.totalCampaigns ?? 0}</p>
              <p className="text-xs text-amber-200/70">Campaigns</p>
            </div>
          </div>
        </GameCard>
        <GameCard index={2} className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-100">{data.stats?.totalLeads ?? 0}</p>
              <p className="text-xs text-amber-200/70">Leads</p>
            </div>
          </div>
        </GameCard>
        <GameCard index={3} className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-100">{data.stats?.totalEmployees ?? 0}</p>
              <p className="text-xs text-amber-200/70">Employees</p>
            </div>
          </div>
        </GameCard>
      </div>

      {/* Basic Info */}
      <GameCard index={4} className="p-4">
        <h3 className="text-sm font-semibold text-amber-100 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Basic Information
        </h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-amber-200/60 mb-1">Name</dt>
            <dd className="text-amber-100">{data.name}</dd>
          </div>
          {phone && (
            <div>
              <dt className="text-xs text-amber-200/60 mb-1 flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</dt>
              <dd className="text-amber-100">{phone}</dd>
            </div>
          )}
          {email && (
            <div>
              <dt className="text-xs text-amber-200/60 mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</dt>
              <dd className="text-amber-100">{email}</dd>
            </div>
          )}
          {data.address && (
            <div>
              <dt className="text-xs text-amber-200/60 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</dt>
              <dd className="text-amber-100">{data.address}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-amber-200/60 mb-1">Company</dt>
            <dd className="text-amber-100">{companyName}</dd>
          </div>
        </dl>
      </GameCard>

      {/* Journey Timeline */}
      <GamePanel>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-amber-100 mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            {companyName} - Journey Timeline
          </h2>
          <ClientJourneyTimeline invoices={data.invoices || []} campaigns={data.campaigns || []} />
        </div>
      </GamePanel>

      {/* Invoices */}
      <GamePanel>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-amber-100 mb-4 uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices ({data.invoices?.length ?? 0})
          </h3>
          {!data.invoices?.length ? (
            <p className="text-amber-200/60 text-center py-8">No invoices</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.invoices.map((inv: any, i: number) => (
                <GameCard key={inv.id} index={i} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-amber-100">{inv.invoiceNumber}</p>
                      <p className="text-xs text-amber-200/60 mt-0.5">
                        {new Date(inv.issueDate).toLocaleDateString()} - {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getInvoiceStatusStyle(inv.status))}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-amber-400 mt-2">{formatCurrency(inv.totalAmount)}</p>
                </GameCard>
              ))}
            </div>
          )}
        </div>
      </GamePanel>

      {/* Campaigns */}
      <GamePanel>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-amber-100 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaigns ({data.campaigns?.length ?? 0})
          </h3>
          {!data.campaigns?.length ? (
            <p className="text-amber-200/60 text-center py-8">No campaigns</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.campaigns.map((c: any, i: number) => (
                <GameCard key={c.id} index={i} className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-semibold text-amber-100">{c.name}</h4>
                      {c.description && <p className="text-sm text-amber-200/70 mt-0.5 line-clamp-2">{c.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <span className={cn('px-2 py-0.5 rounded text-xs border', getCampaignTypeStyle(c.type))}>
                        {c.type}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-xs border', c.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-700/60 text-amber-200/80')}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-amber-200/80 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(c.startDate).toLocaleDateString()}</span>
                    <span className="text-amber-400 flex items-center gap-1"><DollarSign className="h-3 w-3" /> {formatCurrency(c.budget)}</span>
                  </div>
                  {c.project && (
                    <p className="text-xs text-amber-200/60 mt-1">Project: {c.project.title} ({c.project.status})</p>
                  )}
                </GameCard>
              ))}
            </div>
          )}
        </div>
      </GamePanel>

      {/* Employee Groups */}
      <GamePanel>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-amber-100 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employee Groups & Members ({data.employeeGroups?.length ?? 0} groups, {data.employees?.length ?? 0} employees)
          </h3>
          {!data.employeeGroups?.length ? (
            <p className="text-amber-200/60 text-center py-8">No employee groups</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.employeeGroups.map((g: any, i: number) => (
                <GameCard key={g.id} index={i} className="p-4">
                  <h4 className="font-semibold text-amber-100">{g.name}</h4>
                  {g.description && <p className="text-sm text-amber-200/70 mt-0.5">{g.description}</p>}
                  <div className="mt-3 space-y-2">
                    {g.members?.map((m: any) => (
                      <div key={m.id} className="p-2 rounded bg-slate-800/40 border border-amber-500/10">
                        <p className="text-sm text-amber-100">{m.user?.name || m.user?.email}</p>
                        {(m.designation || m.department) && (
                          <p className="text-xs text-amber-200/60">{[m.designation, m.department].filter(Boolean).join(' • ')}</p>
                        )}
                      </div>
                    )) || <p className="text-xs text-amber-200/60">No members</p>}
                  </div>
                </GameCard>
              ))}
            </div>
          )}
        </div>
      </GamePanel>
    </div>
  );
}
