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
  Palette,
  Calendar,
  Phone,
  Layout,
  Menu,
  FileCode,
  Monitor,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { PermissionGuard } from './PermissionGuard';
import { themeApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

interface SubMenuItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
  permission?: string;
  submenu?: SubMenuItem[];
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
      {
        label: 'Inbox',
        icon: MessageSquare,
        permission: 'can_manage_inbox',
        submenu: [
          { label: 'All Messages', path: '/inbox', icon: MessageSquare },
          { label: 'Inbox Report', path: '/inbox-report', icon: BarChart3 },
        ]
      },
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
  // Section 2.5: Meeting Schedule (মিটিং শিডিউল)
  {
    label: 'Meeting Schedule',
    items: [
      {
        label: 'My Meetings',
        icon: Calendar,
        path: '/my-meetings'
      },
      {
        label: 'All Meetings',
        icon: Calendar,
        path: '/meeting-schedule',
        permission: 'can_manage_leads'
      }
    ]
  },
  // Section 2.6: Call Schedule (কল শিডিউল)
  {
    label: 'Call Schedule',
    items: [
      {
        label: 'All Calls',
        icon: Phone,
        path: '/call-schedule',
        permission: 'can_manage_leads'
      },
      {
        label: 'My Calls',
        icon: Phone,
        path: '/my-calls'
      }
    ]
  },
  // Section 2.7: Time Tracking
  {
    label: 'Time Tracking',
    items: [
      {
        label: 'Activity Monitor',
        icon: Monitor,
        path: '/activity-monitor',
        permission: 'can_manage_root_items',
      },
    ],
  },
  // Section 3: Project Management (প্রজেক্ট ম্যানেজমেন্ট)
  {
    label: 'Project Management',
    items: [
      { label: 'Create Project', icon: Briefcase, path: '/admin/projects/new', permission: 'can_manage_projects' },
      { label: 'Project List', icon: FileCode, path: '/admin/projects', permission: 'can_manage_projects' },
      { label: 'Projects & Clients', icon: Users, path: '/admin/projects-clients', permission: 'can_manage_companies' },
    ]
  },
  // Section 3.5: Client Setup (ক্লায়েন্ট সেটাপ)
  {
    label: '',
    items: [
      { label: 'ক্লায়েন্ট সেটাপ', icon: Users, path: '/client-setup/pending-clients', permission: 'can_approve_clients' },
    ]
  },
  // Section 3.7: Invoice Management (ইনভয়েজ ম্যানেজমেন্ট)
  {
    label: 'Invoice Management',
    items: [
      {
        label: 'Create Invoice',
        icon: Receipt,
        path: '/invoice/new',
        permission: 'can_manage_invoices',
      },
      {
        label: 'Invoice List',
        icon: FileCode,
        path: '/invoice',
        permission: 'can_manage_invoices',
      },
    ],
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
          { label: 'Pending Clients', path: '/finance/pending-clients', icon: DollarSign, permission: 'can_approve_clients' },
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
      {
        label: 'Services',
        icon: Package,
        permission: 'can_manage_products',
        submenu: [
          { label: 'All Services', path: '/services', icon: Eye },
          { label: 'Add New Service', path: '/services/new', icon: Plus },
          { label: 'Service Categories', path: '/service-categories', icon: Eye },
        ],
      },
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
          {
            label: 'Theme Design',
            icon: Palette,
            permission: 'can_manage_root_items',
            submenu: [
              { label: 'Theme Settings', path: '/theme-design', icon: Palette },
              { label: 'Hero Design', path: '/theme-design/homepage/hero', icon: Layout },
              { label: 'Header Design', path: '/theme-design/homepage/header', icon: Menu },
              { label: 'Color Change', path: '/theme-design/homepage/colors', icon: Palette },
            ]
          },
          { label: 'Integrations', path: '/integrations', icon: Plug },
          { label: 'Task Configuration', path: '/task-config', icon: ListChecks },
          { label: 'Settings', path: '/settings', icon: Settings },
        ]
      },
    ]
  },
  // Section 7: SuperAdmin Dashboard
  {
    label: 'SuperAdmin Dashboard',
    items: [
      {
        label: 'New cPanel Setup',
        icon: FileCode,
        path: '/admin/cpanel-auto-deployment-guide',
        permission: 'can_manage_root_items',
      },
    ]
  },
  // Section 8: Facebook (SuperAdmin – set App ID/Secret before connecting pages)
  {
    label: 'Facebook',
    items: [
      {
        label: 'App Config',
        icon: Plug,
        path: '/settings/facebook-app-config',
        permission: 'can_manage_root_items',
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
      {/* Mobile overlay - game-style blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-game-sidebar-overlay backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar - Game setup design */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 flex flex-col transition-transform duration-300 ease-out",
          "transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          background: 'linear-gradient(175deg, #0f172a 0%, #1e293b 25%, #0c0a1a 60%, #1e1b4b 100%)',
          boxShadow: isOpen ? '4px 0 24px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,119,6,0.25)' : 'none',
        }}
      >
        {/* Golden accent line - shimmer */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/90 to-transparent pointer-events-none z-10" style={{ boxShadow: '0 1px 4px rgba(217,119,6,0.4)' }} />
        {/* Corner frame accents */}
        <div className="absolute top-0 left-0 w-10 h-10 border-l-2 border-t-2 border-amber-500/60 rounded-tl-lg pointer-events-none z-10" />
        <div className="absolute top-0 right-0 w-10 h-10 border-r-2 border-t-2 border-amber-500/60 rounded-tr-lg pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-l-2 border-b-2 border-amber-500/40 rounded-bl-lg pointer-events-none z-10" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-r-2 border-b-2 border-amber-500/40 rounded-br-lg pointer-events-none z-10" />

        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-amber-500/20 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            {siteLogo ? (
              <img
                src={getImageUrl(siteLogo)}
                alt={siteName}
                className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(217,119,6,0.3)]"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-amber-500/50 bg-gradient-to-br from-amber-600 to-amber-800"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 12px rgba(217,119,6,0.2)' }}
              >
                <span className="text-white font-bold text-sm">O</span>
              </div>
            )}
            <span className="font-bold text-amber-100 text-base tracking-wide">{siteName}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-lg text-amber-200/90 hover:text-white hover:bg-amber-500/20 transition-all duration-200 hover:scale-105"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="game-sidebar-nav flex-1 overflow-y-auto py-4 min-h-0">
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
              <div key={section.label || `section-${sectionIndex}`} className={cn(section.label && "mt-5 first:mt-0")}>
                {/* Section Header - game-style */}
                {section.label && (
                  <div className="px-4 py-2 mb-2 relative" style={{ animationDelay: `${sectionIndex * 50}ms` }}>
                    <h3 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.2em]">
                      {section.label}
                    </h3>
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                  </div>
                )}

                {/* Section Items */}
                <ul className="space-y-1">
                  {visibleItems.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = item.path ? location.pathname === item.path : item.submenu?.some(sub => location.pathname === sub.path);

                    // Render dropdown menu item
                    if (item.submenu && item.submenu.length > 0) {
                      const isDropdownOpen = openDropdowns[item.label] || false;
                      const hasActiveSubmenu = item.submenu.some(sub => location.pathname === sub.path);

                      const staggerMs = sectionIndex * 20 + itemIndex * 35;
                      return (
                        <li
                          key={item.label}
                          className="animate-game-nav-reveal"
                          style={{ animationDelay: `${staggerMs}ms`, animationFillMode: 'both' }}
                        >
                          <button
                            onClick={() => toggleDropdown(item.label)}
                            className={cn(
                              "group/nav w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mx-2",
                              "hover:bg-amber-500/15 hover:border-l-2 hover:border-amber-500/60",
                              hasActiveSubmenu
                                ? "bg-amber-500/20 text-amber-200 border-l-2 border-amber-500"
                                : "text-slate-300 hover:text-amber-100 border-l-2 border-transparent"
                            )}
                          >
                            <Icon className={cn(
                              "w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover/nav:scale-110",
                              hasActiveSubmenu ? "text-amber-400" : "text-slate-400 group-hover/nav:text-amber-400"
                            )} />
                            <span className="flex-1 text-left">{item.label}</span>
                            <div
                              className={cn(
                                "flex-shrink-0 transition-transform duration-300",
                                isDropdownOpen ? "rotate-0" : "-rotate-90"
                              )}
                            >
                              <ChevronDown className="w-4 h-4 text-amber-500/70" />
                            </div>
                          </button>
                          <div
                            className={cn(
                              "overflow-hidden transition-all duration-300 ease-out",
                              isDropdownOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            )}
                          >
                            <ul className="ml-6 mt-1 mb-2 space-y-0.5 border-l-2 border-amber-500/30 pl-3">
                              {item.submenu
                                .filter((subItem) => !subItem.permission || user?.permissions?.[subItem.permission] || user?.roleName === 'SuperAdmin')
                                .map((subItem) => {
                                  const SubIcon = subItem.icon || Eye;
                                  const isSubActive = location.pathname === subItem.path;
                                  const hasNestedSubmenu = subItem.submenu && subItem.submenu.length > 0;
                                  const nestedDropdownKey = `${item.label}-${subItem.label}`;
                                  const isNestedDropdownOpen = openDropdowns[nestedDropdownKey] || false;
                                  const hasActiveNestedSubmenu = subItem.submenu?.some(nested => location.pathname === nested.path);

                                  if (hasNestedSubmenu) {
                                    return (
                                      <li key={subItem.label}>
                                        <button
                                          onClick={() => toggleDropdown(nestedDropdownKey)}
                                          className={cn(
                                            "group/sub w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal transition-all duration-200",
                                            "hover:bg-amber-500/10 hover:text-amber-200",
                                            hasActiveNestedSubmenu
                                              ? "bg-amber-500/15 text-amber-200 font-medium"
                                              : "text-slate-400"
                                          )}
                                        >
                                          <SubIcon className="w-4 h-4 flex-shrink-0 transition-transform group-hover/sub:scale-110" />
                                          <span className="flex-1 text-left">{subItem.label}</span>
                                          <ChevronRight className={cn(
                                            "w-4 h-4 text-amber-500/50 transition-transform duration-300",
                                            isNestedDropdownOpen && "rotate-90"
                                          )} />
                                        </button>
                                        <div
                                          className={cn(
                                            "overflow-hidden transition-all duration-300 ease-in-out",
                                            isNestedDropdownOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                          )}
                                        >
                                          <ul className="ml-3 mt-1 mb-1 space-y-0.5 border-l-2 border-amber-500/20 pl-3">
                                            {subItem.submenu!.map((nestedItem) => {
                                              const NestedIcon = nestedItem.icon || Eye;
                                              const isNestedActive = location.pathname === nestedItem.path;

                                              return (
                                                <li key={nestedItem.path}>
                                                  <Link
                                                    to={nestedItem.path!}
                                                    onClick={() => {
                                                      if (window.innerWidth < 1024) setIsOpen(false);
                                                    }}
                                                    className={cn(
                                                      "group/lnk flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-normal transition-all duration-200",
                                                      "hover:bg-amber-500/10 hover:text-amber-200",
                                                      isNestedActive
                                                        ? "bg-amber-500/15 text-amber-200 font-medium"
                                                        : "text-slate-400"
                                                    )}
                                                  >
                                                    <NestedIcon className="w-4 h-4 flex-shrink-0 transition-transform group-hover/lnk:scale-110" />
                                                    <span className="flex-1 text-left">{nestedItem.label}</span>
                                                  </Link>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      </li>
                                    );
                                  }

                                  return (
                                    <li key={subItem.path}>
                                      <Link
                                        to={subItem.path!}
                                        onClick={() => {
                                          if (window.innerWidth < 1024) setIsOpen(false);
                                        }}
                                        className={cn(
                                          "group/subLink flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal transition-all duration-200",
                                          "hover:bg-amber-500/10 hover:text-amber-200",
                                          isSubActive
                                            ? "bg-amber-500/15 text-amber-200 font-medium"
                                            : "text-slate-400"
                                        )}
                                      >
                                        <SubIcon className="w-4 h-4 flex-shrink-0 transition-transform group-hover/subLink:scale-110" />
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

                    // Render regular menu item - game-style
                    const staggerMs = sectionIndex * 20 + itemIndex * 35;
                    return (
                      <li
                        key={item.path}
                        className="animate-game-nav-reveal"
                        style={{ animationDelay: `${staggerMs}ms`, animationFillMode: 'both' }}
                      >
                        <Link
                          to={item.path!}
                          onClick={() => {
                            if (item.path === '/inbox') setIsOpen(false);
                            else if (window.innerWidth < 1024) setIsOpen(false);
                          }}
                          className={cn(
                            "group/nav flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mx-2",
                            "hover:bg-amber-500/15 hover:border-l-2 hover:border-amber-500/60",
                            isActive
                              ? "bg-amber-500/20 text-amber-200 border-l-2 border-amber-500"
                              : "text-slate-300 hover:text-amber-100 border-l-2 border-transparent"
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover/nav:scale-110",
                            isActive ? "text-amber-400" : "text-slate-400 group-hover/nav:text-amber-400"
                          )} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="bg-amber-500/90 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0 animate-game-badge-pulse">
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

        {/* Footer - game-style user card */}
        <div className="p-4 border-t border-amber-500/20 flex-shrink-0 relative z-10">
          <div
            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg border border-amber-500/20 bg-slate-800/40"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-amber-500/50 overflow-hidden flex-shrink-0 bg-slate-800/80"
              style={{ boxShadow: '0 0 10px rgba(217,119,6,0.2)' }}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-amber-200 text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-100 truncate">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-amber-500/80 truncate">
                {user?.roleName || 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-amber-200 hover:bg-amber-500/15 border border-transparent hover:border-amber-500/30 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-amber-500/70" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

