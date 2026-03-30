import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import {
  LayoutDashboard, Users, Building2, Briefcase, CheckSquare, DollarSign,
  BarChart3, MessageSquare, Settings, Shield, Cog, ListChecks, Target, Plug,
  Megaphone, Eye, Package, CreditCard, Calendar, Phone, Layout, Image as ImageIcon,
  Menu, FileCode, FileEdit, FileText, Monitor, Receipt, Link2, Server, Terminal,
  ArrowLeftRight, Plus,
} from 'lucide-react';

interface SearchItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  keywords?: string[];
}

// Flat list of all searchable routes matching the sidebar
const ALL_SEARCH_ITEMS: SearchItem[] = [
  // Core
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Main', keywords: ['home', 'overview'] },
  { label: 'All Messages', path: '/inbox', icon: MessageSquare, category: 'Inbox', keywords: ['chat', 'message', 'conversation'] },
  { label: 'Inbox Report', path: '/inbox-report', icon: BarChart3, category: 'Inbox', keywords: ['report', 'analytics'] },

  // CRM & Sales
  { label: 'All Leads', path: '/leads', icon: Target, category: 'CRM & Sales', keywords: ['lead', 'prospect', 'customer'] },
  { label: 'Lead Configuration', path: '/lead-config', icon: ListChecks, category: 'CRM & Sales', keywords: ['lead config', 'setup'] },
  { label: 'Lead Form Configuration', path: '/lead-form-config', icon: FileEdit, category: 'CRM & Sales', keywords: ['form', 'lead form'] },
  { label: 'Companies', path: '/companies', icon: Building2, category: 'CRM & Sales', keywords: ['company', 'business', 'organization'] },
  { label: 'Employees', path: '/employees', icon: Users, category: 'CRM & Sales', keywords: ['employee', 'staff', 'team'] },
  { label: 'Employee Groups', path: '/employee-groups', icon: Users, category: 'CRM & Sales', keywords: ['group', 'team'] },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare, category: 'CRM & Sales', keywords: ['task', 'todo', 'work'] },

  // Meetings & Calls
  { label: 'My Meetings', path: '/my-meetings', icon: Calendar, category: 'Meetings', keywords: ['meeting', 'schedule', 'calendar'] },
  { label: 'All Meetings', path: '/meeting-schedule', icon: Calendar, category: 'Meetings', keywords: ['meeting', 'all'] },
  { label: 'All Calls', path: '/call-schedule', icon: Phone, category: 'Calls', keywords: ['call', 'phone', 'schedule'] },
  { label: 'My Calls', path: '/my-calls', icon: Phone, category: 'Calls', keywords: ['call', 'my'] },

  // Time Tracking
  { label: 'Activity Monitor', path: '/activity-monitor', icon: Monitor, category: 'Time Tracking', keywords: ['activity', 'monitor', 'tracking', 'time'] },

  // Projects
  { label: 'Create Project', path: '/admin/projects/new', icon: Briefcase, category: 'Projects', keywords: ['project', 'new', 'create'] },
  { label: 'Project List', path: '/admin/projects', icon: FileCode, category: 'Projects', keywords: ['project', 'list'] },
  { label: 'Projects & Clients', path: '/admin/projects-clients', icon: Users, category: 'Projects', keywords: ['project', 'client'] },
  { label: 'Pending Clients', path: '/client-setup/pending-clients', icon: Users, category: 'Client Setup', keywords: ['pending', 'client', 'approval'] },

  // Invoices
  { label: 'Create Invoice', path: '/invoice/new', icon: Receipt, category: 'Invoices', keywords: ['invoice', 'bill', 'new'] },
  { label: 'Invoice List', path: '/invoice', icon: FileCode, category: 'Invoices', keywords: ['invoice', 'list', 'bill'] },

  // Finance
  { label: 'Finance Overview', path: '/finance', icon: DollarSign, category: 'Finance', keywords: ['finance', 'money', 'overview'] },
  { label: 'Payment Management', path: '/payment-management', icon: DollarSign, category: 'Finance', keywords: ['payment', 'manage'] },
  { label: 'Payment Settings', path: '/payment-settings', icon: CreditCard, category: 'Finance', keywords: ['payment', 'settings', 'gateway'] },

  // Content & Marketing
  { label: 'View Campaigns', path: '/campaigns', icon: Megaphone, category: 'Marketing', keywords: ['campaign', 'marketing'] },
  { label: 'Add New Campaign', path: '/campaigns/new', icon: Plus, category: 'Marketing', keywords: ['campaign', 'new', 'create'] },
  { label: 'SMS Marketing', path: '/sms-marketing', icon: Megaphone, category: 'Marketing', keywords: ['sms', 'marketing', 'message'] },
  { label: 'All Products', path: '/products', icon: Package, category: 'Products', keywords: ['product', 'item'] },
  { label: 'Add New Product', path: '/products/new', icon: Plus, category: 'Products', keywords: ['product', 'new', 'add'] },
  { label: 'Product Categories', path: '/product-categories', icon: Eye, category: 'Products', keywords: ['category', 'product'] },
  { label: 'All Services', path: '/services', icon: Package, category: 'Services', keywords: ['service'] },
  { label: 'Add New Service', path: '/services/new', icon: Plus, category: 'Services', keywords: ['service', 'new', 'add'] },
  { label: 'Service Categories', path: '/service-categories', icon: Eye, category: 'Services', keywords: ['service', 'category'] },
  { label: 'Dollar Buy Sell', path: '/dollar-exchange', icon: ArrowLeftRight, category: 'Finance', keywords: ['dollar', 'exchange', 'currency', 'buy', 'sell'] },

  // System Administration
  { label: 'Users', path: '/users', icon: Shield, category: 'System', keywords: ['user', 'account', 'admin'] },
  { label: 'Roles', path: '/roles', icon: Shield, category: 'System', keywords: ['role', 'permission', 'access'] },
  { label: 'General Settings', path: '/system-settings', icon: Cog, category: 'System', keywords: ['settings', 'config', 'general'] },
  { label: 'Integrations', path: '/integrations', icon: Plug, category: 'System', keywords: ['integration', 'connect', 'api'] },
  { label: 'Task Configuration', path: '/task-config', icon: ListChecks, category: 'System', keywords: ['task', 'config'] },
  { label: 'Settings', path: '/settings', icon: Settings, category: 'System', keywords: ['settings'] },

  // Theme Design
  { label: 'Theme Settings', path: '/theme-design', icon: Layout, category: 'Theme', keywords: ['theme', 'design', 'appearance'] },
  { label: 'Hero Design', path: '/theme-design/homepage/hero', icon: ImageIcon, category: 'Theme', keywords: ['hero', 'banner', 'homepage'] },
  { label: 'Client Sliders', path: '/theme-design/client-sliders', icon: ImageIcon, category: 'Theme', keywords: ['slider', 'client', 'carousel'] },
  { label: 'Header Design', path: '/theme-design/homepage/header', icon: Menu, category: 'Theme', keywords: ['header', 'nav', 'navigation'] },
  { label: 'Color Change', path: '/theme-design/homepage/colors', icon: Layout, category: 'Theme', keywords: ['color', 'palette', 'brand'] },

  // SuperAdmin
  { label: 'Omni Setup on Server', path: '/admin/omni-server-setup', icon: Terminal, category: 'SuperAdmin', keywords: ['server', 'setup', 'deploy'] },
  { label: 'New cPanel Setup', path: '/admin/cpanel-auto-deployment-guide', icon: FileCode, category: 'SuperAdmin', keywords: ['cpanel', 'deployment', 'guide'] },
  { label: 'Advanced WhatsApp Setup', path: '/admin/advanced-whatsapp-setup', icon: Server, category: 'SuperAdmin', keywords: ['whatsapp', 'setup', 'advanced'] },
  { label: 'Chatwoot Integration', path: '/admin/chatwoot-settings', icon: Link2, category: 'SuperAdmin', keywords: ['chatwoot', 'chat', 'integration'] },
  { label: 'SMS Integration', path: '/admin/sms-settings', icon: Plug, category: 'SuperAdmin', keywords: ['sms', 'integration'] },

  // Facebook
  { label: 'Facebook App Config', path: '/settings/facebook-app-config', icon: Plug, category: 'Facebook', keywords: ['facebook', 'app', 'config', 'api'] },
  { label: 'Facebook Verification Guideline', path: '/admin/facebook-verification-guideline', icon: FileText, category: 'Facebook', keywords: ['facebook', 'verification', 'guideline'] },
];

// Category color map
const CATEGORY_COLORS: Record<string, string> = {
  'Main': 'text-amber-400',
  'Inbox': 'text-blue-400',
  'CRM & Sales': 'text-emerald-400',
  'Meetings': 'text-violet-400',
  'Calls': 'text-cyan-400',
  'Time Tracking': 'text-orange-400',
  'Projects': 'text-indigo-400',
  'Client Setup': 'text-pink-400',
  'Invoices': 'text-yellow-400',
  'Finance': 'text-green-400',
  'Marketing': 'text-red-400',
  'Products': 'text-purple-400',
  'Services': 'text-teal-400',
  'System': 'text-slate-400',
  'Theme': 'text-rose-400',
  'SuperAdmin': 'text-amber-300',
  'Facebook': 'text-blue-300',
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const lower = q.toLowerCase();
    const matched = ALL_SEARCH_ITEMS.filter(item => {
      const inLabel = item.label.toLowerCase().includes(lower);
      const inCategory = item.category.toLowerCase().includes(lower);
      const inKeywords = item.keywords?.some(k => k.toLowerCase().includes(lower));
      return inLabel || inCategory || inKeywords;
    }).slice(0, 8); // max 8 results
    setResults(matched);
    setHighlighted(0);
  }, []);

  useEffect(() => {
    search(query);
  }, [query, search]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && results[highlighted]) {
      window.location.href = results[highlighted].path;
      clearSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/60 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search pages... (Ctrl+K)"
          className="w-full pl-10 pr-9 py-2 bg-slate-800/60 border border-amber-500/20 rounded-lg text-sm text-amber-100 placeholder-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all duration-200"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-amber-500/50 hover:text-amber-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          className="absolute top-full mt-2 left-0 right-0 z-[100] rounded-xl overflow-hidden border border-amber-500/25 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,119,6,0.2)',
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-amber-500/15 bg-amber-500/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </span>
            <span className="text-[10px] text-amber-500/40 hidden sm:block">↑↓ navigate · Enter to open</span>
          </div>

          {/* Results */}
          <ul className="py-1 max-h-72 overflow-y-auto">
            {results.map((item, idx) => {
              const Icon = item.icon;
              const isHighlighted = idx === highlighted;
              const catColor = CATEGORY_COLORS[item.category] || 'text-amber-400';

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={clearSearch}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-100 group ${
                      isHighlighted
                        ? 'bg-amber-500/15 border-l-2 border-amber-500'
                        : 'border-l-2 border-transparent hover:bg-amber-500/10 hover:border-amber-500/50'
                    }`}
                  >
                    {/* Icon ring */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                      isHighlighted
                        ? 'bg-amber-500/20 border-amber-500/40'
                        : 'bg-slate-800/70 border-amber-500/15 group-hover:border-amber-500/30'
                    }`}>
                      <Icon className={`w-4 h-4 ${isHighlighted ? 'text-amber-300' : 'text-slate-400 group-hover:text-amber-400'} transition-colors`} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate transition-colors ${
                        isHighlighted ? 'text-amber-100' : 'text-slate-300 group-hover:text-amber-100'
                      }`}>
                        {item.label}
                      </p>
                      <p className={`text-[11px] font-medium ${catColor} opacity-80`}>
                        {item.category}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 ${
                      isHighlighted
                        ? 'text-amber-400 translate-x-0 opacity-100'
                        : 'text-slate-600 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                    }`} />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-amber-500/10 bg-slate-900/60">
            <p className="text-[10px] text-amber-500/30 text-center">Press Esc to close</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {isOpen && query.trim() && results.length === 0 && (
        <div
          className="absolute top-full mt-2 left-0 right-0 z-[100] rounded-xl border border-amber-500/20 p-5 text-center animate-in fade-in duration-150"
          style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <Search className="w-8 h-8 text-amber-500/20 mx-auto mb-2" />
          <p className="text-sm text-amber-200/40">No results for "<span className="text-amber-400">{query}</span>"</p>
          <p className="text-xs text-amber-500/25 mt-1">Try a different keyword</p>
        </div>
      )}
    </div>
  );
}
