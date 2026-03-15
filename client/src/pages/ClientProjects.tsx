import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectApi, serviceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileText, Loader2, ChevronRight, ChevronLeft, Sparkles, Activity, ShieldCheck, Zap, Terminal, Clock, CreditCard, LayoutGrid, Filter, ArrowUpDown, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export function ClientProjects() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [signingProjectId, setSigningProjectId] = useState<number | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [formData, setFormData] = useState({
    serviceId: 0,
    title: '',
    description: '',
    budget: '',
    deliveryStartDate: '',
    deliveryEndDate: '',
    time: '',
  });

  // Filter & Sort State
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [searchInList, setSearchInList] = useState('');

  // Fetch services
  const { data: servicesResponse } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await serviceApi.getAll(true);
      return response.data.data || [];
    },
  });

  const services = servicesResponse || [];

  const { data: projectsResponse, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectApi.getAll();
      return response.data.data;
    },
    refetchInterval: (query) => {
      return signingProjectId ? 2000 : false;
    },
  });

  const projects = projectsResponse || [];

  // Filtering & Sorting Logic
  const filteredProjects = projects
    .filter((p: any) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesSearch = p.title.toLowerCase().includes(searchInList.toLowerCase()) || 
                           p.id.toString().includes(searchInList);
      return matchesStatus && matchesSearch;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'budget-high') return Number(b.budget) - Number(a.budget);
      if (sortBy === 'budget-low') return Number(a.budget) - Number(b.budget);
      return 0;
    });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const signedProjectId = params.get('signed');
    if (signedProjectId) {
      const projectId = parseInt(signedProjectId);
      setSigningProjectId(projectId);
      // Force refetch projects to get updated invoice data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setTimeout(() => {
        setSigningProjectId(null);
        // Refetch again after animation completes
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        navigate(location.pathname, { replace: true });
      }, 3000);
    }
  }, [location, navigate, queryClient]);

  // Listen for custom event to open project form (from welcome modal or ProductsServicesSection)
  useEffect(() => {
    const handleOpenProjectForm = (e: Event) => {
      const customEvent = e as CustomEvent<{ preSelectService?: any }>;
      const preSelectService = customEvent.detail?.preSelectService;

      if (preSelectService) {
        setSelectedService(preSelectService);
        setFormStep(2);
      } else {
        setFormStep(1);
        setSelectedService(null);
      }
      setIsFormOpen(true);
    };

    window.addEventListener('open-project-form', handleOpenProjectForm);
    return () => {
      window.removeEventListener('open-project-form', handleOpenProjectForm);
    };
  }, []);

  // When service is selected, auto-fill form data
  useEffect(() => {
    if (selectedService) {
      const start = selectedService.deliveryStartDate
        ? new Date(selectedService.deliveryStartDate)
        : new Date();
      const end = selectedService.deliveryEndDate
        ? new Date(selectedService.deliveryEndDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const days = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
      setFormData({
        serviceId: selectedService.id,
        title: selectedService.title,
        description: selectedService.details,
        budget: selectedService.pricing.toString(),
        deliveryStartDate: start.toISOString().split('T')[0],
        deliveryEndDate: end.toISOString().split('T')[0],
        time: `${days} days`,
      });
    }
  }, [selectedService]);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectApi.create(data),
    onSuccess: () => {
      window.alert('Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsFormOpen(false);
      setFormStep(1);
      setSelectedService(null);
      setFormData({
        serviceId: 0,
        title: '',
        description: '',
        budget: '',
        deliveryStartDate: '',
        deliveryEndDate: '',
        time: '',
      });
    },
    onError: (error: any) => {
      console.error('Failed to create project:', error);
      const message = error?.response?.data?.message || 'Failed to create project';
      window.alert(message);
    },
  });

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setFormStep(2);
  };

  const handleBudgetChange = (value: string) => {
    if (!selectedService) return;
    const budget = parseFloat(value) || 0;
    const basePrice = Number(selectedService.pricing);
    const minBudget = basePrice * 0.5;
    const maxBudget = basePrice * 1.5;

    if (budget >= minBudget && budget <= maxBudget) {
      setFormData({ ...formData, budget: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const basePrice = Number(selectedService.pricing);
    const minBudget = basePrice * 0.5;
    const maxBudget = basePrice * 1.5;
    const budget = parseFloat(formData.budget);

    if (budget < minBudget || budget > maxBudget) {
      alert(`Budget must be between ${minBudget.toFixed(2)} and ${maxBudget.toFixed(2)}`);
      return;
    }

    createMutation.mutate({
      serviceId: formData.serviceId,
      title: formData.title,
      description: formData.description,
      budget: budget,
      deliveryStartDate: formData.deliveryStartDate,
      deliveryEndDate: formData.deliveryEndDate,
      time: formData.time,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30';
      case 'InProgress':
        return 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30';
      case 'StartedWorking':
        return 'from-indigo-500/40 to-indigo-500/10 text-indigo-300 border-indigo-400/40 animate-pulse ring-2 ring-indigo-500/20';
      case 'Submitted':
        return 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30';
      case 'Draft':
        return 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30';
      default:
        return 'from-slate-500/20 to-slate-500/5 text-slate-400 border-slate-500/30';
    }
  };

  const selectedServiceMinBudget = selectedService ? Number(selectedService.pricing) * 0.5 : 0;
  const selectedServiceMaxBudget = selectedService ? Number(selectedService.pricing) * 1.5 : 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-transparent rounded-[2rem] border border-amber-500/30 flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Activity className="w-8 h-8 text-amber-500 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-amber-100 tracking-tighter uppercase mb-1">
              Your <span className="text-emerald-500">Projects</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded-lg border border-slate-700 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                <Terminal className="w-3 h-3" /> System: Online
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded-lg border border-slate-700 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                <Activity className="w-3 h-3" /> Data: Synced
              </span>
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => setIsFormOpen(true)}
          className="relative group h-14 px-8 bg-amber-500 text-slate-900 hover:bg-amber-400 font-black text-lg rounded-2xl shadow-xl shadow-amber-500/20 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
          START NEW PROJECT
        </Button>
      </div>

      {isFormOpen && (
        <div className="game-card-border rounded-xl p-6 bg-slate-800/80 border border-amber-500/30">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-amber-100">
              New Project {formStep === 1 ? '- Select Service' : '- Setup Project'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {formStep === 1
                ? 'Choose a service to get started'
                : 'Adjust budget and delivery dates as needed'}
            </p>
          </div>
          <div>
            {formStep === 1 ? (
              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No services available</div>
                ) : (
                  <div className="grid gap-4">
                    {services.map((service: any) => (
                      <div
                        key={service.id}
                        className="border border-amber-500/20 rounded-lg p-4 hover:border-amber-500/50 cursor-pointer transition-colors bg-slate-800/40"
                        onClick={() => handleServiceSelect(service)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-amber-100">{service.title}</h3>
                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{service.details}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="font-medium text-amber-400">
                                ${Number(service.pricing).toLocaleString()}
                              </span>
                              <span className="text-slate-500">
                                {new Date(service.deliveryStartDate).toLocaleDateString()} -{' '}
                                {new Date(service.deliveryEndDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-amber-500/70" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormStep(1);
                    setSelectedService(null);
                  }}
                  className="w-full border border-amber-500/50 bg-slate-800/60 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedService && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-amber-200">Selected Service</p>
                    <p className="text-sm text-amber-100">{selectedService.title}</p>
                    <p className="text-xs text-amber-500/80 mt-1">Base Price: ${Number(selectedService.pricing).toLocaleString()}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="title" className="text-amber-200/90">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-slate-800/60 border-amber-500/30 text-amber-100 placeholder-slate-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-amber-200/90">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-500/30 rounded-md bg-slate-800/60 text-amber-100 placeholder-slate-500"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="budget" className="text-amber-200/90">
                    Budget * (Range: ${selectedServiceMinBudget.toFixed(2)} - ${selectedServiceMaxBudget.toFixed(2)})
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    min={selectedServiceMinBudget}
                    max={selectedServiceMaxBudget}
                    value={formData.budget}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    className="bg-slate-800/60 border-amber-500/30 text-amber-100"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    You can adjust budget between 50% and 150% of service price
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryStartDate" className="text-amber-200/90">Delivery Start Date *</Label>
                    <Input
                      id="deliveryStartDate"
                      type="date"
                      value={formData.deliveryStartDate}
                      onChange={(e) => setFormData({ ...formData, deliveryStartDate: e.target.value })}
                      min={selectedService ? new Date(selectedService.deliveryStartDate).toISOString().split('T')[0] : undefined}
                      max={selectedService ? new Date(selectedService.deliveryEndDate).toISOString().split('T')[0] : undefined}
                      className="bg-slate-800/60 border-amber-500/30 text-amber-100"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryEndDate" className="text-amber-200/90">Delivery End Date *</Label>
                    <Input
                      id="deliveryEndDate"
                      type="date"
                      value={formData.deliveryEndDate}
                      onChange={(e) => setFormData({ ...formData, deliveryEndDate: e.target.value })}
                      min={formData.deliveryStartDate || (selectedService ? new Date(selectedService.deliveryStartDate).toISOString().split('T')[0] : undefined)}
                      max={selectedService ? new Date(selectedService.deliveryEndDate).toISOString().split('T')[0] : undefined}
                      className="bg-slate-800/60 border-amber-500/30 text-amber-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="time" className="text-amber-200/90">Timeframe *</Label>
                  <Input
                    id="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g., 4 weeks"
                    className="bg-slate-800/60 border-amber-500/30 text-amber-100 placeholder-slate-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormStep(1)}
                    className="border border-amber-500/50 bg-slate-800/60 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 border border-amber-500/50 bg-amber-500/30 text-amber-100 hover:bg-amber-500/50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Project'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setFormStep(1);
                      setSelectedService(null);
                    }}
                    className="border border-amber-500/50 bg-slate-800/60 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <LayoutGrid className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-100 uppercase tracking-tighter">Active Projects</h2>
              <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">{filteredProjects.length} of {projects.length} nodes connected to grid</p>
            </div>
          </div>

          {/* Advanced Filter Bar */}
          <div className="flex flex-col lg:flex-row items-center gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800/50 backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search projects..."
                value={searchInList}
                onChange={(e) => setSearchInList(e.target.value)}
                className="w-full bg-slate-800/40 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/40 rounded-2xl border border-slate-700/30">
                <Filter className="w-3.5 h-3.5 text-amber-500/70" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-black text-amber-100 uppercase border-none focus:ring-0 p-0 pr-6"
                >
                  <option value="All">All Status</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Completed">Completed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/40 rounded-2xl border border-slate-700/30">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500/70" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-black text-emerald-100 uppercase border-none focus:ring-0 p-0 pr-6"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="budget-high">Budget: High</option>
                  <option value="budget-low">Budget: Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-[2rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="w-32 h-32 border-2 border-amber-500/20 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                <div className="w-24 h-24 border-2 border-t-amber-500/80 border-transparent rounded-full animate-spin" />
              </div>
              <Activity className="w-10 h-10 text-amber-500 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="mt-8 text-center">
              <p className="text-amber-500 font-mono text-sm tracking-[0.3em] uppercase animate-pulse">Scanning Grid</p>
              <div className="mt-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">Initialising local database hooks...</div>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-900/40 rounded-[2rem] border border-slate-800/50 border-dashed backdrop-blur-md">
            <Terminal className="w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No matching results found</p>
            <Button
              onClick={() => {
                setStatusFilter('All');
                setSearchInList('');
              }}
              className="mt-6 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all font-mono text-xs uppercase tracking-tighter"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project: any, index: number) => {
                const isSigning = signingProjectId === project.id;
                const latestInvoice = project.invoices && project.invoices.length > 0 ? project.invoices[0] : null;
                const statusStyles = getStatusColor(project.status);
                
                return (
                  <motion.div
                    key={project.id}
                    layoutId={`project-${project.id}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    whileHover={{ y: -5 }}
                    onClick={() => !isSigning && navigate(`/client/projects/${project.id}`)}
                    className={`group relative flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-[2rem] overflow-hidden transition-all hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/5 cursor-pointer ${isSigning ? 'ring-2 ring-amber-500/50' : ''}`}
                  >
                    {/* Status Glow Background */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br transition-opacity opacity-0 group-hover:opacity-100 ${statusStyles.split(' ')[0]} blur-[40px] -z-10`} />
                    
                    {/* SVG Ambient Animation */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        <motion.path
                          d="M 0,100 C 20,80 40,120 60,100 C 80,80 100,120 120,100 C 140,80 160,120 180,100"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.5"
                          className="text-amber-500/30"
                          animate={{ 
                            d: [
                              "M 0,100 C 20,80 40,120 60,100 C 80,80 100,120 120,100 C 140,80 160,120 180,100",
                              "M 0,100 C 20,120 40,80 60,100 C 80,120 100,80 120,100 C 140,120 160,80 180,100",
                              "M 0,100 C 20,80 40,120 60,100 C 80,80 100,120 120,100 C 140,80 160,120 180,100"
                            ] 
                          }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        />
                        {project.status === 'StartedWorking' && (
                          <motion.circle 
                            cx="180" cy="20" r="15" 
                            fill="none" stroke="currentColor" strokeWidth="0.5" 
                            className="text-indigo-500/40"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            strokeDasharray="4 4"
                          />
                        )}
                      </svg>
                    </div>

                    {/* Card Header */}
                    <div className="p-6 pb-0">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 bg-gradient-to-r border rounded-full text-[10px] font-mono uppercase tracking-widest ${statusStyles} flex items-center gap-1.5`}>
                          {(project.status === 'InProgress' || project.status === 'StartedWorking') && (
                            <motion.span 
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]"
                            />
                          )}
                          {project.status === 'InProgress' && <Zap className="w-3 h-3 animate-pulse" />}
                          {project.status === 'StartedWorking' && <Activity className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />}
                          {project.status === 'Submitted' && <ShieldCheck className="w-3 h-3" />}
                          {project.status === 'StartedWorking' ? 'WORKING' : project.status}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600 tracking-tighter">
                          ID: {project.id.toString().padStart(6, '0')}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-black text-amber-100 group-hover:text-amber-400 transition-colors line-clamp-1 truncate">
                        {project.title} <span className="text-[9px] text-slate-500 font-mono ml-1">({
                          new Intl.DateTimeFormat('en-GB', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          }).format(new Date(project.createdAt))
                        })</span>
                      </h3>
                      
                      {project.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed min-h-[2.5rem]">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 gap-px bg-slate-800/30 mt-6 border-y border-slate-800/50">
                      <div className="p-4 bg-slate-900/40">
                        <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1 flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3" /> Allocation
                        </div>
                        <div className="text-sm font-black text-amber-100/90 tracking-tight">
                          ${Number(project.budget).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900/40 border-l border-slate-800/50">
                        <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Duration
                        </div>
                        <div className="text-sm font-black text-amber-100/90 tracking-tight">
                          {project.time}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-auto p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        {latestInvoice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/client/invoices/${latestInvoice.id}`);
                            }}
                            className="flex-1 bg-slate-800/50 border-slate-700 h-11 rounded-xl text-amber-100 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold group/btn"
                          >
                            <FileText className="w-3.5 h-3.5 mr-2 group-hover/btn:text-amber-500 transition-colors" />
                            VIEW INVOICE
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/client/projects/${project.id}`);
                          }}
                          className={`flex-1 ${latestInvoice ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' : 'bg-slate-800/50 border-slate-700 text-amber-100 hover:bg-slate-800'} h-11 rounded-xl transition-all text-xs font-bold group/btn`}
                        >
                          <ChevronRight className="w-3.5 h-3.5 mr-2 group-hover/btn:translate-x-1 transition-transform" />
                          VIEW DETAILS
                        </Button>
                        
                        {project.status === 'Draft' && !isSigning && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSigningProjectId(project.id);
                              navigate(`/client/projects/${project.id}/sign`);
                            }}
                            className="flex-1 bg-amber-500 text-slate-900 h-11 rounded-xl font-black hover:bg-amber-400 transition-all text-xs uppercase"
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            AUTHORIZE
                          </Button>
                        )}

                        {isSigning && (
                          <div className="flex-1 bg-amber-500/10 border border-amber-500/20 h-11 rounded-xl flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Syncing</span>
                          </div>
                        )}
                      </div>

                      {/* Timeline Indicator */}
                      <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: project.status === 'Completed' ? '100%' : project.status === 'InProgress' ? '65%' : '15%' }}
                          className={`absolute inset-0 h-full rounded-full transition-all duration-1000 ${
                            project.status === 'Completed' ? 'bg-emerald-500' :
                            project.status === 'InProgress' ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
