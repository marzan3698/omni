import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Package,
  CreditCard,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { PermissionGuard } from './PermissionGuard';
import { themeApi } from '@/lib/api';

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

interface MenuSection {
  label: string;
  items: NavItem[];
}

// Reorganized menu sections (বাংলা: পুনর্বিন্যাসকৃত মেনু সেকশন)
const menuSections: MenuSection[] = [
  // Section 1: Main Operations (প্রধান অপারেশন)
  {
    label: '',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Inbox', icon: MessageSquare, path: '/inbox', permission: 'can_manage_inbox' },
    ]
  },
  // Section 2: CRM & Sales (সিআরএম এবং বিক্রয়)
  {
    label: 'CRM & Sales',
    items: [
      {
        label: 'Leads',
        icon: Target,
        permission: 'can_view_leads',
        submenu: [
          { label: 'All Leads', path: '/leads', icon: Eye },
          { label: 'Lead Configuration', path: '/lead-config', icon: ListChecks },
        ]
      },
      { label: 'Companies', icon: Building2, path: '/companies', permission: 'can_view_companies' },
      { label: 'Employees', icon: Users, path: '/employees', permission: 'can_view_employees' },
      { label: 'Employee Groups', icon: Users, path: '/employee-groups', permission: 'can_manage_employees' },
      { label: 'Tasks', icon: CheckSquare, path: '/tasks', permission: 'can_view_tasks' },
    ]
  },
  // Section 3: Project Management (প্রকল্প ব্যবস্থাপনা)
  {
    label: 'Project Management',
    items: [
      { label: 'Projects & Clients', icon: Users, path: '/admin/projects-clients', permission: 'can_manage_companies' },
    ]
  },
  // Section 4: Finance (আর্থিক)
  {
    label: 'Finance',
    items: [
      {
        label: 'Finance',
        icon: DollarSign,
        permission: 'can_view_finance',
        submenu: [
          { label: 'Finance Overview', path: '/finance', icon: DollarSign },
          { label: 'Payment Management', path: '/payment-management', icon: DollarSign },
          { label: 'Payment Settings', path: '/payment-settings', icon: CreditCard },
        ]
      },
    ]
  },
  // Section 5: Content & Marketing (কনটেন্ট এবং মার্কেটিং)
  {
    label: 'Content & Marketing',
    items: [
      {
        label: 'Campaigns',
        icon: Megaphone,
        permission: 'can_manage_campaigns',
        submenu: [
          { label: 'View Campaigns', path: '/campaigns', icon: Eye },
          { label: 'Add New Campaign', path: '/campaigns/new', icon: Plus },
        ]
      },
      {
        label: 'Products',
        icon: Package,
        permission: 'can_manage_products',
        submenu: [
          { label: 'All Products', path: '/products', icon: Eye },
          { label: 'Add New Product', path: '/products/new', icon: Plus },
          { label: 'Product Categories', path: '/product-categories', icon: Eye },
          { label: 'Add Category', path: '/product-categories/new', icon: Plus },
        ]
      },
      { label: 'Services', icon: Package, path: '/services', permission: 'can_manage_products' },
    ]
  },
  // Section 6: System Administration (সিস্টেম প্রশাসন)
  {
    label: 'System Administration',
    items: [
      { label: 'Users', icon: Shield, path: '/users', permission: 'can_view_all_users' },
      { label: 'Roles', icon: Shield, path: '/roles', permission: 'can_manage_roles' },
      {
        label: 'System Settings',
        icon: Cog,
        permission: 'can_manage_root_items',
        submenu: [
          { label: 'General Settings', path: '/system-settings', icon: Cog },
          { label: 'Theme Design', path: '/theme-design', icon: Palette },
          { label: 'Integrations', path: '/integrations', icon: Plug },
          { label: 'Task Configuration', path: '/task-config', icon: ListChecks },
          { label: 'Settings', path: '/settings', icon: Settings },
        ]
      },
    ]
  },
];

export function Sidebar() {
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebar();
  const { user, logout } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Fetch theme settings
  const { data: themeSettings } = useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      try {
        const response = await themeApi.getThemeSettings();
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const siteLogo = themeSettings?.siteLogo || null;
  const siteName = themeSettings?.siteName || 'Omni CRM';
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

  // Auto-expand dropdowns with active submenu items
  useEffect(() => {
    const activeDropdowns: Record<string, boolean> = {};
    menuSections.forEach(section => {
      section.items.forEach(item => {
        if (item.submenu?.some(sub => location.pathname === sub.path)) {
          activeDropdowns[item.label] = true;
        }
      });
    });
    setOpenDropdowns(prev => ({ ...prev, ...activeDropdowns }));
  }, [location.pathname]);

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
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            {siteLogo ? (
              <img
                src={siteLogo.startsWith('/') ? `${apiBaseUrl}${siteLogo}` : siteLogo}
                alt={siteName}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
            )}
            <span className="font-semibold text-slate-900 text-lg">{siteName}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 min-h-0">
          {menuSections.map((section, sectionIndex) => {
            // Filter items by permission and role
            const visibleItems = section.items.filter(item => {
              // Hide Tasks menu for Client role
              if (item.path === '/tasks' && user?.roleName === 'Client') {
                return false;
              }
              // Show Tasks menu for all non-Client roles (users can see their own tasks)
              if (item.path === '/tasks' && user?.roleName !== 'Client') {
                return true;
              }
              const hasPermission = !item.permission || user?.permissions?.[item.permission] || user?.roleName === 'SuperAdmin';
              return hasPermission;
            });

            // Skip section if no visible items
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label || `section-${sectionIndex}`} className={cn(section.label && "mt-6 first:mt-0")}>
                {/* Section Header */}
                {section.label && (
                  <div className="px-4 py-2 mb-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {section.label}
                    </h3>
                  </div>
                )}

                {/* Section Items */}
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.path ? location.pathname === item.path : item.submenu?.some(sub => location.pathname === sub.path);

                    // Render dropdown menu item
                    if (item.submenu && item.submenu.length > 0) {
                      const isDropdownOpen = openDropdowns[item.label] || false;
                      const hasActiveSubmenu = item.submenu.some(sub => location.pathname === sub.path);

                      return (
                        <li key={item.label}>
                          <button
                            onClick={() => toggleDropdown(item.label)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                              "hover:bg-gray-50",
                              hasActiveSubmenu
                                ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600"
                                : "text-slate-700 hover:text-slate-900"
                            )}
                          >
                            <Icon className={cn(
                              "w-5 h-5 flex-shrink-0 transition-colors",
                              hasActiveSubmenu ? "text-indigo-600" : "text-slate-500"
                            )} />
                            <span className="flex-1 text-left">{item.label}</span>
                            <div className="flex-shrink-0 transition-transform duration-200" style={{
                              transform: isDropdownOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                            }}>
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            </div>
                          </button>
                          <div
                            className={cn(
                              "overflow-hidden transition-all duration-300 ease-in-out",
                              isDropdownOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            )}
                          >
                            <ul className="ml-6 mt-1 mb-1 space-y-1 border-l-2 border-indigo-200 pl-4">
                              {item.submenu.map((subItem) => {
                                const SubIcon = subItem.icon || Eye;
                                const isSubActive = location.pathname === subItem.path;

                                return (
                                  <li key={subItem.path}>
                                    <Link
                                      to={subItem.path}
                                      onClick={() => {
                                        if (window.innerWidth < 1024) {
                                          setIsOpen(false);
                                        }
                                      }}
                                      className={cn(
                                        "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-normal transition-colors",
                                        "hover:bg-gray-50",
                                        isSubActive
                                          ? "bg-indigo-50 text-indigo-600 font-medium"
                                          : "text-slate-600 hover:text-slate-900"
                                      )}
                                    >
                                      <SubIcon className="w-4 h-4 flex-shrink-0" />
                                      <span className="flex-1 text-left">{subItem.label}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </li>
                      );
                    }

                    // Render regular menu item
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path!}
                          onClick={() => {
                            // Close sidebar when clicking Inbox menu item (all screen sizes)
                            if (item.path === '/inbox') {
                              setIsOpen(false);
                            } else {
                              // Close sidebar on mobile when navigating to other pages
                              if (window.innerWidth < 1024) {
                                setIsOpen(false);
                              }
                            }
                          }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                            "hover:bg-gray-50",
                            isActive
                              ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600"
                              : "text-slate-700 hover:text-slate-900"
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5 flex-shrink-0",
                            isActive ? "text-indigo-600" : "text-slate-500"
                          )} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
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

