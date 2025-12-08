import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Briefcase, Target, Users, LogOut, FileText } from 'lucide-react';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Omni CRM</span>
          </div>
          
          <nav className="space-y-2">
            <Link
              to="/client/dashboard"
              className="flex items-center gap-3 px-4 py-2 rounded-md text-slate-700 hover:bg-gray-100"
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/client/projects"
              className="flex items-center gap-3 px-4 py-2 rounded-md text-slate-700 hover:bg-gray-100"
            >
              <Briefcase className="w-5 h-5" />
              Projects
            </Link>
            <Link
              to="/client/campaigns"
              className="flex items-center gap-3 px-4 py-2 rounded-md text-slate-700 hover:bg-gray-100"
            >
              <Target className="w-5 h-5" />
              Campaigns
            </Link>
            <Link
              to="/client/leads"
              className="flex items-center gap-3 px-4 py-2 rounded-md text-slate-700 hover:bg-gray-100"
            >
              <Users className="w-5 h-5" />
              Leads
            </Link>
            <Link
              to="/client/invoices"
              className="flex items-center gap-3 px-4 py-2 rounded-md text-slate-700 hover:bg-gray-100"
            >
              <FileText className="w-5 h-5" />
              Invoices
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-900">{user?.email}</p>
            <p className="text-xs text-slate-500">Client</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

