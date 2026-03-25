import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, LayoutDashboard, Briefcase, FileText, ArrowLeftRight, MessageSquare, ShoppingCart, Package, Sparkles } from 'lucide-react';
import { serviceCategoryApi, serviceApi } from '@/lib/api';
import { getServiceCategoryIcon } from '@/lib/serviceCategoryIcons';
import { useShop } from '@/contexts/ShopContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const CLIENT_FEATURES = [
  { id: 'f1', title: 'Dashboard', type: 'Feature', icon: LayoutDashboard, action: '/client/dashboard' },
  { id: 'f2', title: 'My Projects', type: 'Feature', icon: Briefcase, action: '/client/projects' },
  { id: 'f3', title: 'My Invoices', type: 'Feature', icon: FileText, action: '/client/invoices' },
  { id: 'f4', title: 'Dollar Exchange', type: 'Feature', icon: ArrowLeftRight, action: '/client/exchange' },
  { id: 'f5', title: 'Contact Support', type: 'Feature', icon: MessageSquare, action: '/contact' },
  { id: 'f6', title: 'Shopping Cart', type: 'Feature', icon: ShoppingCart, action: 'toggle_cart' },
];

export function ClientGlobalSearch() {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { setSearchTerm: setGlobalSearchTerm, setSelectedCategoryId, toggleCart, addToCart } = useShop();

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories-client'],
    queryFn: async () => {
      const response = await serviceCategoryApi.getListForClient();
      return response.data.data || [];
    },
  });

  // Fetch Active Services
  const { data: services = [] } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: async () => {
      const response = await serviceApi.getAll(true);
      return response.data.data || [];
    },
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync global search with local when the user stops interacting with suggestions
  useEffect(() => {
    if (!isDropdownOpen) {
      setGlobalSearchTerm(localSearchTerm);
    }
  }, [localSearchTerm, isDropdownOpen, setGlobalSearchTerm]);

  // Derived filtered data
  const normalizedSearch = localSearchTerm.toLowerCase().trim();
  
  const filteredFeatures = normalizedSearch 
    ? CLIENT_FEATURES.filter(f => f.title.toLowerCase().includes(normalizedSearch))
    : [];

  const filteredCategories = normalizedSearch
    ? categories.filter((c: any) => c.name.toLowerCase().includes(normalizedSearch))
    : [];

  const filteredServices = normalizedSearch
    ? services.filter((s: any) => s.title.toLowerCase().includes(normalizedSearch) || s.details?.toLowerCase().includes(normalizedSearch))
    : [];

  const hasResults = filteredFeatures.length > 0 || filteredCategories.length > 0 || filteredServices.length > 0;

  const handleFeatureClick = (feature: any) => {
    setIsDropdownOpen(false);
    setLocalSearchTerm('');
    if (feature.action === 'toggle_cart') {
      toggleCart();
    } else {
      navigate(feature.action);
    }
  };

  const handleCategoryClick = (category: any) => {
    setIsDropdownOpen(false);
    setLocalSearchTerm('');
    setSelectedCategoryId(category.id);
    navigate('/client/dashboard');
  };

  const handleServiceClick = (service: any) => {
    setIsDropdownOpen(false);
    setLocalSearchTerm('');
    addToCart(service);
    navigate('/client/checkout');
  };

  return (
    <div className="flex-1 max-w-3xl relative" ref={containerRef}>
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
      <input
        type="text"
        placeholder="Search for services, products, features and solutions..."
        value={localSearchTerm}
        onChange={(e) => {
          setLocalSearchTerm(e.target.value);
          setIsDropdownOpen(e.target.value.length > 0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsDropdownOpen(false);
            setGlobalSearchTerm(localSearchTerm);
            if (window.location.pathname !== '/client/dashboard') {
              navigate('/client/dashboard');
            }
          }
        }}
        onFocus={() => {
          if (localSearchTerm.length > 0) {
            setIsDropdownOpen(true);
          }
        }}
        className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl py-3.5 pl-14 pr-6 text-[15px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-inner"
      />

      <AnimatePresence>
        {isDropdownOpen && localSearchTerm.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 right-0 max-h-[70vh] overflow-y-auto bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl shadow-slate-900/50 z-50 custom-scrollbar"
            style={{
              boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(217, 119, 6, 0.2)'
            }}
          >
            {hasResults ? (
              <div className="p-2 space-y-4">
                {/* Features Section */}
                {filteredFeatures.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                      System Features
                    </div>
                    {filteredFeatures.map((feature: any) => {
                      const Icon = feature.icon;
                      return (
                        <div
                          key={feature.id}
                          onClick={() => handleFeatureClick(feature)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-800/80 group-hover:bg-amber-500/10 border border-white/5 group-hover:border-amber-500/20 flex items-center justify-center transition-all">
                            <Icon className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-slate-200 group-hover:text-amber-100 transition-colors">
                              {feature.title}
                            </div>
                            <div className="text-[10px] text-slate-500">Go to application feature</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Categories Section */}
                {filteredCategories.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                      Categories
                    </div>
                    {filteredCategories.map((category: any) => {
                      const CategoryIcon = getServiceCategoryIcon(category.icon) || Package;
                      return (
                        <div
                          key={`cat-${category.id}`}
                          onClick={() => handleCategoryClick(category)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-800/80 group-hover:bg-blue-500/10 border border-white/5 group-hover:border-blue-500/20 flex items-center justify-center transition-all">
                            <CategoryIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-slate-200 group-hover:text-blue-100 transition-colors">
                              {category.name}
                            </div>
                            <div className="text-[10px] text-slate-500">Filter dashboard services</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Services Section */}
                {filteredServices.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                      Service Packages
                    </div>
                    {filteredServices.map((service: any) => (
                      <div
                        key={`srv-${service.id}`}
                        onClick={() => handleServiceClick(service)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800/80 group-hover:from-emerald-500/10 group-hover:to-emerald-500/5 border border-white/5 group-hover:border-emerald-500/20 flex flex-col items-center justify-center flex-shrink-0 transition-all shadow-[0_2px_10px_-4px_rgba(0,0,0,0.5)]">
                          <Sparkles className="w-4 h-4 text-emerald-400/50 group-hover:text-emerald-400 transition-colors mb-0.5" />
                          <div className="text-[8px] font-black text-emerald-500/50 group-hover:text-emerald-400 uppercase tracking-widest">Buy</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                              <div className="text-[14px] font-bold text-slate-200 group-hover:text-emerald-100 transition-colors truncate">
                                {service.title}
                              </div>
                              <div className="text-[12px] font-black text-emerald-400/80">
                                  ${Number(service.pricing).toLocaleString()}
                              </div>
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 group-hover:text-slate-400 transition-colors">
                            {service.details || 'Professional service package'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 border border-white/5">
                    <Search className="w-6 h-6 text-slate-500" />
                </div>
                <div className="text-sm font-bold text-slate-400">No results found</div>
                <div className="text-[11px] text-slate-500 mt-1">Try tweaking your search terms</div>
              </div>
            )}
            
            <div className="p-3 bg-slate-900/80 border-t border-white/5 backdrop-blur-sm sticky bottom-0 text-[10px] text-slate-500 text-center font-mono uppercase tracking-widest">
              Press Enter to apply broad filter
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
