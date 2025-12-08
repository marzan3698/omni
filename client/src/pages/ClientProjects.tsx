import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectApi, serviceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      setTimeout(() => {
        setSigningProjectId(null);
        navigate(location.pathname, { replace: true });
      }, 3000);
    }
  }, [location, navigate]);

  // When service is selected, auto-fill form data
  useEffect(() => {
    if (selectedService) {
      const minBudget = Number(selectedService.pricing) * 0.5;
      const maxBudget = Number(selectedService.pricing) * 1.5;
      setFormData({
        serviceId: selectedService.id,
        title: selectedService.title,
        description: selectedService.details,
        budget: selectedService.pricing.toString(),
        deliveryStartDate: new Date(selectedService.deliveryStartDate).toISOString().split('T')[0],
        deliveryEndDate: new Date(selectedService.deliveryEndDate).toISOString().split('T')[0],
        time: `${Math.ceil((new Date(selectedService.deliveryEndDate).getTime() - new Date(selectedService.deliveryStartDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
      });
    }
  }, [selectedService]);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectApi.create(data),
    onSuccess: () => {
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
        return 'bg-green-100 text-green-700';
      case 'InProgress':
        return 'bg-blue-100 text-blue-700';
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const selectedServiceMinBudget = selectedService ? Number(selectedService.pricing) * 0.5 : 0;
  const selectedServiceMaxBudget = selectedService ? Number(selectedService.pricing) * 1.5 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-1">Manage your projects</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {isFormOpen && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>
              Create New Project {formStep === 1 ? '- Select Service' : '- Configure Project'}
            </CardTitle>
            <CardDescription>
              {formStep === 1
                ? 'Choose a service to get started'
                : 'Adjust budget and delivery dates as needed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formStep === 1 ? (
              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No services available</div>
                ) : (
                  <div className="grid gap-4">
                    {services.map((service: any) => (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 cursor-pointer transition-colors"
                        onClick={() => handleServiceSelect(service)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{service.title}</h3>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{service.details}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="font-medium text-indigo-600">
                                ${Number(service.pricing).toLocaleString()}
                              </span>
                              <span className="text-slate-500">
                                {new Date(service.deliveryStartDate).toLocaleDateString()} -{' '}
                                {new Date(service.deliveryEndDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
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
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedService && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-indigo-900">Selected Service</p>
                    <p className="text-sm text-indigo-700">{selectedService.title}</p>
                    <p className="text-xs text-indigo-600 mt-1">Base Price: ${Number(selectedService.pricing).toLocaleString()}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="budget">
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
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    You can adjust budget between 50% and 150% of service price
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryStartDate">Delivery Start Date *</Label>
                    <Input
                      id="deliveryStartDate"
                      type="date"
                      value={formData.deliveryStartDate}
                      onChange={(e) => setFormData({ ...formData, deliveryStartDate: e.target.value })}
                      min={selectedService ? new Date(selectedService.deliveryStartDate).toISOString().split('T')[0] : undefined}
                      max={selectedService ? new Date(selectedService.deliveryEndDate).toISOString().split('T')[0] : undefined}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryEndDate">Delivery End Date *</Label>
                    <Input
                      id="deliveryEndDate"
                      type="date"
                      value={formData.deliveryEndDate}
                      onChange={(e) => setFormData({ ...formData, deliveryEndDate: e.target.value })}
                      min={formData.deliveryStartDate || (selectedService ? new Date(selectedService.deliveryStartDate).toISOString().split('T')[0] : undefined)}
                      max={selectedService ? new Date(selectedService.deliveryEndDate).toISOString().split('T')[0] : undefined}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="time">Timeframe *</Label>
                  <Input
                    id="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g., 4 weeks"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormStep(1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} className="flex-1">
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
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>All Projects ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No projects yet</div>
          ) : (
            <div className="space-y-4">
              {projects.map((project: any) => {
                const isSigning = signingProjectId === project.id;
                return (
                  <div
                    key={project.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all ${
                      isSigning ? 'ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{project.title}</h3>
                          {isSigning && (
                            <div className="flex items-center gap-2 text-indigo-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-xs font-medium">Processing...</span>
                            </div>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-slate-600 mt-1">{project.description}</p>
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
                        {project.status === 'Draft' && !isSigning && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSigningProjectId(project.id);
                              navigate(`/client/projects/${project.id}/sign`);
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Sign
                          </Button>
                        )}
                        {(isSigning || (signingProjectId === project.id && project.status === 'Submitted')) && (
                          <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {project.status === 'Submitted' ? 'Processing...' : 'Signing...'}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSigning && (
                      <div className="mt-3 pt-3 border-t border-indigo-200">
                        <div className="flex items-center gap-2 text-sm text-indigo-700">
                          <div className="flex-1 bg-indigo-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
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
        </CardContent>
      </Card>
    </div>
  );
}
