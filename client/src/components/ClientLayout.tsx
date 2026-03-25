import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Briefcase, 
  Target, 
  Users, 
  LogOut, 
  FileText, 
  ChevronDown, 
  Search, 
  HelpCircle,
  MessageSquare,
  Package,
  ShoppingCart,
  ArrowLeftRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { serviceCategoryApi } from '@/lib/api';
import { getServiceCategoryIcon } from '@/lib/serviceCategoryIcons';
import { CartDrawer } from './CartDrawer';
import { ClientGlobalSearch } from './ClientGlobalSearch';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchTerm, setSearchTerm, selectedCategoryId, setSelectedCategoryId, cart, toggleCart } = useShop();
  const [isServicesOpen, setIsServicesOpen] = useState(true);
  const [openCategoryIds, setOpenCategoryIds] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(currentTime);

  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories-client'],
    queryFn: async () => {
      const response = await serviceCategoryApi.getListForClient();
      return response.data.data;
    },
  });

  // Filter root categories
  const rootCategories = categories.filter((c: any) => !c.parentId);

  const toggleCategory = (id: number) => {
    setOpenCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCategorySelect = (id: number | 'all') => {
    setSelectedCategoryId(id);
    if (location.pathname !== '/client/dashboard') {
      navigate('/client/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isCurrentPath = (path: string) => location.pathname === path;
  const isServicesActive = isCurrentPath('/client/projects') || isCurrentPath('/client/invoices');

  // Auto-expand category if a child is selected
  useEffect(() => {
    if (selectedCategoryId !== 'all') {
      const parent = categories.find((c: any) => 
        c.children?.some((child: any) => child.id === selectedCategoryId)
      );
      if (parent && !openCategoryIds.includes(parent.id)) {
        setOpenCategoryIds(prev => [...prev, parent.id]);
      }
    }
  }, [selectedCategoryId, categories]);

  return (
    <div className="min-h-screen game-layout-bg">
      {/* Sidebar - Refined Structure */}
      <aside
        className="fixed left-0 top-0 z-50 h-full w-64 flex flex-col border-r border-amber-500/20"
        style={{
          background: 'linear-gradient(175deg, #0f172a 0%, #1e293b 25%, #0c0a1a 60%, #1e1b4b 100%)',
          boxShadow: '4px 0 24px -4px rgba(0,0,0,0.5)',
        }}
      >
        {/* Frame Accents */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/90 to-transparent pointer-events-none z-10" />
        
        <div className="flex flex-col h-full relative z-10 overflow-hidden">
          {/* Logo Section */}
          <div className="flex items-center gap-3 h-16 px-4 border-b border-amber-500/10 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-500/50 bg-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.3)]">
              <span className="text-white font-bold text-xs">O</span>
            </div>
            <span className="font-bold text-amber-100 text-sm tracking-widest uppercase">Omni CRM</span>
          </div>

          <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
            {/* Main Navigation */}
            <div className="px-3 space-y-1.5 mb-8">
                <Link
                    to="/client/dashboard"
                    onClick={() => handleCategorySelect('all')}
                    className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isCurrentPath('/client/dashboard') && selectedCategoryId === 'all'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/20 shadow-[0_0_15px_-5px_rgba(217,119,6,0.3)]'
                        : 'text-slate-400 hover:text-amber-100 hover:bg-slate-800/40'
                    )}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                </Link>

                {/* My Services Dropdown */}
                <div className="space-y-1">
                    <button
                        onClick={() => setIsServicesOpen(!isServicesOpen)}
                        className={cn(
                            'w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                            isServicesActive ? 'text-amber-200' : 'text-slate-400 hover:text-amber-100'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Briefcase className="w-4 h-4" />
                            <span>My Services</span>
                        </div>
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isServicesOpen ? "rotate-0" : "-rotate-90")} />
                    </button>
                    
                    {isServicesOpen && (
                        <div className="ml-5 pl-4 border-l border-amber-500/10 space-y-1.5 mt-1 animate-in slide-in-from-left-2 duration-200">
                            <Link
                                to="/client/projects"
                                className={cn(
                                    'flex items-center gap-3 px-4 py-1.5 rounded-lg text-[13px] transition-all',
                                    isCurrentPath('/client/projects') ? 'text-amber-400 font-medium' : 'text-slate-500 hover:text-slate-300'
                                )}
                            >
                                Projects
                            </Link>
                            <Link
                                to="/client/invoices"
                                className={cn(
                                    'flex items-center gap-3 px-4 py-1.5 rounded-lg text-[13px] transition-all',
                                    isCurrentPath('/client/invoices') ? 'text-amber-400 font-medium' : 'text-slate-500 hover:text-slate-300'
                                )}
                            >
                                Invoices
                            </Link>
                            <Link
                                to="/client/exchange"
                                className={cn(
                                    'flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] transition-all',
                                    isCurrentPath('/client/exchange') ? 'text-amber-400 font-medium' : 'text-slate-500 hover:text-slate-300'
                                )}
                            >
                                <ArrowLeftRight className="w-3 h-3" />
                                Dollar Exchange
                            </Link>
                        </div>
                    )}
                </div>

                {/* Categories - Directly listed */}
                <div className="pt-4 border-t border-amber-500/5 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Categories</p>
                    
                    {rootCategories.map((category: any) => {
                        const hasChildren = category.children && category.children.length > 0;
                        const isOpen = openCategoryIds.includes(category.id);
                        const isSelected = selectedCategoryId === category.id || category.children?.some((c: any) => c.id === selectedCategoryId);
                        const CategoryIcon = getServiceCategoryIcon(category.icon) || Package;

                        return (
                            <div key={category.id} className="space-y-1">
                                <div className="flex items-center gap-1 group">
                                    <button
                                        onClick={() => handleCategorySelect(category.id)}
                                        className={cn(
                                            "flex-1 flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] transition-all text-left",
                                            selectedCategoryId === category.id ? 'bg-amber-500/10 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                        )}
                                    >
                                        <CategoryIcon className="w-3.5 h-3.5" />
                                        <span className="truncate">{category.name}</span>
                                    </button>
                                    
                                    {hasChildren && (
                                        <button 
                                            onClick={() => toggleCategory(category.id)}
                                            className="p-2 text-slate-500 hover:text-amber-400 transition-colors"
                                        >
                                            <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isOpen ? "rotate-0" : "-rotate-90")} />
                                        </button>
                                    )}
                                </div>

                                {hasChildren && isOpen && (
                                    <div className="ml-8 pl-4 border-l border-amber-500/5 space-y-1 animate-in slide-in-from-left-2 duration-200">
                                        {category.children.map((child: any) => (
                                            <button
                                                key={child.id}
                                                onClick={() => handleCategorySelect(child.id)}
                                                className={cn(
                                                    "w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-all",
                                                    selectedCategoryId === child.id ? 'text-amber-400 font-medium' : 'text-slate-500 hover:text-slate-300'
                                                )}
                                            >
                                                {child.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Support section */}
            <div className="px-4 mt-auto py-6">
                <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/10 shadow-inner">
                    <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-amber-100 uppercase tracking-wider">Need Help?</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                        Contact our support team for custom digital solutions tailored to your business.
                    </p>
                    <button 
                        onClick={() => navigate('/contact')}
                        className="flex items-center gap-2 text-[11px] font-bold text-amber-500 hover:text-amber-400 transition-colors group"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="border-b border-transparent group-hover:border-amber-400/50 transition-all">Contact Support</span>
                    </button>
                </div>
            </div>
          </div>

          <div className="p-4 border-t border-amber-500/10 flex-shrink-0 bg-slate-900/60">
            <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-8 h-8 rounded-full border border-amber-500/30 overflow-hidden bg-slate-800 flex items-center justify-center shadow-lg">
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[10px] font-bold text-amber-500">{user?.email?.[0].toUpperCase()}</span>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-100 truncate">{user?.email}</p>
                    <p className="text-[10px] text-slate-500">Premium Client</p>
                </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all border border-transparent hover:border-rose-400/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content + Topbar with Search */}
      <div className="ml-64 relative min-h-screen">
        <header
          className="sticky top-0 z-40 h-20 border-b border-amber-500/10 backdrop-blur-xl flex items-center justify-between px-8 gap-12"
          style={{ background: 'rgba(15, 23, 42, 0.85)' }}
        >
          {/* Logo/Brand for Header */}
          <div className="flex flex-col flex-shrink-0">
             <h2 className="text-lg font-black text-amber-100 tracking-tight leading-none mb-1">Digital Superstore</h2>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="text-amber-500/60">{formattedDate}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="text-slate-400">{formattedTime}</span>
             </div>
          </div>

          {/* Search Bar - Expanded in Header */}
          <ClientGlobalSearch />

          <div className="flex items-center gap-8">
            <div className="hidden xl:flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[3px]">System Online</span>
            </div>
            
            <div className="h-10 w-px bg-slate-800" />
            
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-[12px] font-bold text-amber-100/90 truncate max-w-[180px]">{user?.email}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[2px]">Premium Partner</p>
                </div>
                <div 
                  onClick={() => navigate('/client/profile')}
                  className="w-10 h-10 rounded-2xl overflow-hidden border border-amber-500/20 bg-slate-800 flex items-center justify-center shadow-2xl group hover:border-amber-500/40 transition-all cursor-pointer ring-4 ring-transparent hover:ring-amber-500/5"
                  title="View Profile"
                >
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[12px] font-bold text-amber-500">{user?.email?.[0].toUpperCase()}</span>
                    )}
                </div>
            </div>
          </div>
        </header>
        <main className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
        </main>

        {/* Floating Cart Button */}
        <div className="fixed bottom-8 right-8 z-[60]">
            <button
                onClick={toggleCart}
                className="relative w-16 h-16 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center shadow-2xl shadow-amber-500/40 hover:scale-110 hover:bg-amber-400 transition-all duration-300 group ring-4 ring-amber-500/20"
            >
                <div className="absolute -top-1 -right-1 flex items-center justify-center bg-white text-slate-900 text-[11px] font-black w-6 h-6 rounded-full border-2 border-amber-500 shadow-lg">
                    {cart.length}
                </div>
                <ShoppingCart className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            </button>
        </div>

        {/* Cart Drawer Overlay */}
        <CartDrawer />
      </div>
    </div>
  );
}
