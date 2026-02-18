import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectApi, serviceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileText, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
        return 'bg-green-500/30 text-green-300';
      case 'InProgress':
        return 'bg-blue-500/30 text-blue-300';
      case 'Submitted':
        return 'bg-amber-500/30 text-amber-300';
      default:
        return 'bg-slate-500/30 text-slate-400';
    }
  };

  const selectedServiceMinBudget = selectedService ? Number(selectedService.pricing) * 0.5 : 0;
  const selectedServiceMaxBudget = selectedService ? Number(selectedService.pricing) * 1.5 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-amber-100">Projects</h1>
          <p className="text-slate-300 mt-1">Manage your projects</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="border-amber-500/50 bg-transparent text-amber-100 hover:bg-amber-500/25 hover:text-white hover:border-amber-400/60"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {isFormOpen && (
        <div className="game-card-border rounded-xl p-6 bg-slate-800/80 border border-amber-500/30">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-amber-100">
              Create New Project {formStep === 1 ? '- Select Service' : '- Configure Project'}
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

      <div className="game-card-border rounded-xl p-6 bg-slate-800/60 border border-amber-500/30">
        <h2 className="text-lg font-semibold text-amber-100 mb-4">All Projects ({projects.length})</h2>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
            <p className="text-slate-400 mt-2">Loading...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No projects yet</div>
        ) : (
          <div className="space-y-4">
            {projects.map((project: any) => {
              const isSigning = signingProjectId === project.id;
              const latestInvoice = project.invoices && project.invoices.length > 0 ? project.invoices[0] : null;
              return (
                <div
                  key={project.id}
                  className={`border rounded-lg p-4 transition-all game-card-border ${
                    isSigning ? 'ring-2 ring-amber-500/70 bg-amber-500/10' : 'border-amber-500/20 hover:border-amber-500/40 bg-slate-800/40'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-amber-100">{project.title}</h3>
                        {isSigning && (
                          <div className="flex items-center gap-2 text-amber-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs font-medium">Processing...</span>
                          </div>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-slate-400 mt-1">{project.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-slate-500">
                        <span>Budget: ${Number(project.budget).toLocaleString()}</span>
                        <span>Time: {project.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      {latestInvoice && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/client/invoices/${latestInvoice.id}`)}
                          className="border border-amber-500/50 bg-slate-800/60 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Invoice {latestInvoice.invoiceNumber}
                        </Button>
                      )}
                      {project.status === 'Draft' && !isSigning && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSigningProjectId(project.id);
                            navigate(`/client/projects/${project.id}/sign`);
                          }}
                          className="border-amber-500/50 bg-amber-500/30 text-amber-100 hover:bg-amber-500/50"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Sign
                        </Button>
                      )}
                      {(isSigning || (signingProjectId === project.id && project.status === 'Submitted')) && (
                        <div className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded text-xs font-medium flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {project.status === 'Submitted' ? 'Processing...' : 'Signing...'}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSigning && (
                    <div className="mt-3 pt-3 border-t border-amber-500/20">
                      <div className="flex items-center gap-2 text-sm text-amber-300">
                        <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                        <span className="text-xs">Submitting signature...</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
