export function getProjectStatusColor(status: string) {
  switch (status) {
    case 'Completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'InProgress': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    case 'Submitted': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    case 'StartedWorking': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'Draft': return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
    case 'Cancelled': return 'bg-red-500/20 text-red-300 border-red-500/40';
    default: return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
  }
}

export function getInvoiceStatusColor(status: string) {
  switch (status) {
    case 'Paid': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'Unpaid': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    case 'Overdue': return 'bg-red-500/20 text-red-300 border-red-500/40';
    default: return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
  }
}

export function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'Approved': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'Pending': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    case 'Rejected': return 'bg-red-500/20 text-red-300 border-red-500/40';
    case 'Cancelled': return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
    default: return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
  }
}

export function getCampaignTypeColor(type: string) {
  switch (type.toLowerCase()) {
    case 'sale': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'reach': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'research': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    default: return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
  }
}

export function getLeadStatusColor(status: string) {
  switch (status) {
    case 'Won': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'Lost': return 'bg-red-500/20 text-red-300 border-red-500/40';
    case 'New': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'Negotiation': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    default: return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
  }
}

export const btnOutline = 'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
