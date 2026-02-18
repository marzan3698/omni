import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Briefcase, Target, Users, LogOut, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/client/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/client/projects', icon: Briefcase, label: 'Projects' },
  { to: '/client/campaigns', icon: Target, label: 'Campaigns' },
  { to: '/client/leads', icon: Users, label: 'Leads' },
  { to: '/client/invoices', icon: FileText, label: 'Invoices' },
];

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen game-layout-bg">
      {/* Sidebar - FIFA style */}
      <aside
        className="fixed left-0 top-0 z-50 h-full w-64 flex flex-col"
        style={{
          background: 'linear-gradient(175deg, #0f172a 0%, #1e293b 25%, #0c0a1a 60%, #1e1b4b 100%)',
          boxShadow: '4px 0 24px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,119,6,0.25)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/90 to-transparent pointer-events-none z-10" style={{ boxShadow: '0 1px 4px rgba(217,119,6,0.4)' }} />
        <div className="absolute top-0 left-0 w-10 h-10 border-l-2 border-t-2 border-amber-500/60 rounded-tl-lg pointer-events-none z-10" />
        <div className="absolute top-0 right-0 w-10 h-10 border-r-2 border-t-2 border-amber-500/60 rounded-tr-lg pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-l-2 border-b-2 border-amber-500/40 rounded-bl-lg pointer-events-none z-10" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-r-2 border-b-2 border-amber-500/40 rounded-br-lg pointer-events-none z-10" />

        <div className="flex flex-col h-full relative z-10">
          <div className="flex items-center gap-3 h-16 px-4 border-b border-amber-500/20 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-amber-500/50 bg-gradient-to-br from-amber-600 to-amber-800"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 12px rgba(217,119,6,0.2)' }}
            >
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-bold text-amber-100 text-base tracking-wide">Omni CRM</span>
          </div>

          <nav className="game-sidebar-nav flex-1 overflow-y-auto py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200',
                    'hover:bg-amber-500/15 hover:border-l-2 hover:border-amber-500/60',
                    isActive
                      ? 'bg-amber-500/20 text-amber-200 border-l-2 border-amber-500'
                      : 'text-slate-300 hover:text-amber-100 border-l-2 border-transparent'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      isActive ? 'text-amber-400' : 'text-slate-400'
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-amber-500/20 flex-shrink-0">
            <p className="text-sm font-medium text-amber-100 truncate">{user?.email}</p>
            <p className="text-xs text-amber-500/80 mt-0.5">Client</p>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:bg-amber-500/15 hover:text-amber-200 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content + Topbar */}
      <div className="ml-64">
        <header
          className="sticky top-0 z-30 h-14 border-b border-amber-500/20 backdrop-blur-md"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.85) 100%)',
            boxShadow: '0 1px 0 rgba(217, 119, 6, 0.15), 0 4px 20px -4px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center justify-end h-full px-6">
            <span className="text-sm text-amber-200/90 truncate max-w-[200px]">{user?.email}</span>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
