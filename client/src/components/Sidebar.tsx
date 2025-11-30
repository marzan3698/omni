import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase, 
  CheckSquare, 
  DollarSign, 
  BarChart3,
  MessageSquare,
  Settings,
  X,
  LogOut,
  Shield,
  Cog,
  ListChecks,
  Target,
  Plug,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from './PermissionGuard';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

interface SubMenuItem {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  badge?: number;
  permission?: string;
  submenu?: SubMenuItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Companies', icon: Building2, path: '/companies', permission: 'can_view_companies' },
  { label: 'Employees', icon: Users, path: '/employees', permission: 'can_view_employees' },
  { label: 'Leads', icon: Target, path: '/leads', permission: 'can_view_leads' },
  { label: 'Tasks', icon: CheckSquare, path: '/tasks', permission: 'can_view_tasks' },
  { label: 'Finance', icon: DollarSign, path: '/finance', permission: 'can_view_finance' },
  { label: 'Inbox', icon: MessageSquare, path: '/inbox', permission: 'can_manage_inbox' },
  // SuperAdmin section
  { label: 'Users', icon: Shield, path: '/users', permission: 'can_view_all_users' },
  { label: 'Roles', icon: Shield, path: '/roles', permission: 'can_manage_roles' },
  { label: 'System Settings', icon: Cog, path: '/system-settings', permission: 'can_manage_root_items' },
  { label: 'Integrations', icon: Plug, path: '/integrations', permission: 'can_view_integrations' },
  { label: 'Task Config', icon: ListChecks, path: '/task-config', permission: 'can_manage_task_config' },
  { 
    label: 'Campaigns', 
    icon: Megaphone, 
    permission: 'can_manage_campaigns',
    submenu: [
      { label: 'Add New Campaign', path: '/campaigns/new', icon: Plus },
      { label: 'View Campaigns', path: '/campaigns', icon: Eye },
    ]
  },
  { 
    label: 'Product Management', 
    icon: Package, 
    permission: 'can_manage_products',
    submenu: [
      { label: 'Add New Product', path: '/products/new', icon: Plus },
      { label: 'All Products', path: '/products', icon: Eye },
      { label: 'Add Product Category', path: '/product-categories/new', icon: Plus },
      { label: 'Product Category List', path: '/product-categories', icon: Eye },
    ]
  },
  // Lead Manager section
  { label: 'Lead Config', icon: ListChecks, path: '/lead-config', permission: 'can_manage_lead_config' },
  { label: 'Settings', icon: Settings, path: '/settings', permission: 'can_manage_integrations' },
];

export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-semibold text-slate-900 text-lg">Omni CRM</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 min-h-0">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path ? location.pathname === item.path : item.submenu?.some(sub => location.pathname === sub.path);
              // Check permission or if user is SuperAdmin
              const hasPermission = !item.permission || user?.permissions?.[item.permission] || user?.roleName === 'SuperAdmin';

              if (!hasPermission) return null;

              // Render dropdown menu item
              if (item.submenu && item.submenu.length > 0) {
                const isDropdownOpen = openDropdowns[item.label] || false;
                const hasActiveSubmenu = item.submenu.some(sub => location.pathname === sub.path);

                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        "hover:bg-gray-100",
                        hasActiveSubmenu
                          ? "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600"
                          : "text-slate-700 hover:text-slate-900"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5",
                        hasActiveSubmenu ? "text-indigo-600" : "text-slate-500"
                      )} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isDropdownOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    {isDropdownOpen && (
                      <ul className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon || Eye;
                          const isSubActive = location.pathname === subItem.path;
                          
                          return (
                            <li key={subItem.path}>
                              <Link
                                to={subItem.path}
                                onClick={() => {
                                  if (window.innerWidth < 1024 && onToggle) {
                                    onToggle();
                                  }
                                }}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                  "hover:bg-gray-100",
                                  isSubActive
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-slate-600 hover:text-slate-900"
                                )}
                              >
                                <SubIcon className="w-4 h-4" />
                                <span>{subItem.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // Render regular menu item
              return (
                <li key={item.path}>
                  <Link
                    to={item.path!}
                    onClick={() => {
                      // Close sidebar on mobile when navigating
                      if (window.innerWidth < 1024 && onToggle) {
                        onToggle();
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-gray-100",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600"
                        : "text-slate-700 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5",
                      isActive ? "text-indigo-600" : "text-slate-500"
                    )} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.email}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-xs font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.roleName || 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

