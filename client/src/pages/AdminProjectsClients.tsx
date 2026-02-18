import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { Edit, Trash2, Search, Eye, FolderKanban, Users, Briefcase } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const inputDark =
  'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 rounded-lg';
const btnOutline =
  'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';

const getProjectStatusStyle = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'InProgress':
      return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    case 'Submitted':
      return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    case 'StartedWorking':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'Draft':
      return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
    case 'Cancelled':
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    default:
      return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
  }
};

export function AdminProjectsClients() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'clients'>('projects');
  const [searchTerm, setSearchTerm] = useState('');

  // SuperAdmin sees all companies; others see only their company (includes lead-converted clients)
  const companyId = user?.roleName === 'SuperAdmin' ? undefined : user?.companyId;

  const { data: projectsResponse, isLoading: loadingProjects } = useQuery({
    queryKey: ['admin-projects', searchTerm, companyId],
    queryFn: async () => {
      const response = await adminApi.getAllProjects({
        ...(searchTerm && { search: searchTerm }),
        ...(companyId != null && { companyId }),
      });
      return response.data.data || [];
    },
  });

  const { data: clientsResponse, isLoading: loadingClients } = useQuery({
    queryKey: ['admin-clients', searchTerm, companyId],
    queryFn: async () => {
      const response = await adminApi.getAllClients({
        ...(searchTerm && { search: searchTerm }),
        ...(companyId != null && { companyId }),
      });
      return response.data.data || [];
    },
  });

  const projects = projectsResponse || [];
  const clients = clientsResponse || [];

  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
    },
  });

  const handleDeleteProject = (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleDeleteClient = (id: number) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClientMutation.mutate(id);
    }
  };

  const isLoading = activeTab === 'projects' ? loadingProjects : loadingClients;
  const hasItems = activeTab === 'projects' ? projects.length > 0 : clients.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <GamePanel className="p-6">
        <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
          <Users className="h-8 w-8 text-amber-400" />
          Projects & Clients
        </h1>
        <p className="text-amber-200/80 mt-1">Manage all projects and clients</p>
      </GamePanel>

      {/* Stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GameCard index={0} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{projects.length}</p>
            </div>
            <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10">
              <FolderKanban className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={1} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">
                Total Clients
              </p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{clients.length}</p>
            </div>
            <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10">
              <Users className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </GameCard>
      </div>

      {/* Tab switcher & search */}
      <GamePanel>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-all',
                  activeTab === 'projects'
                    ? 'bg-amber-600 text-white border border-amber-500/50 shadow-sm'
                    : btnOutline
                )}
              >
                <Briefcase className="inline h-4 w-4 mr-2" />
                Projects ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('clients')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-all',
                  activeTab === 'clients'
                    ? 'bg-amber-600 text-white border border-amber-500/50 shadow-sm'
                    : btnOutline
                )}
              >
                <Users className="inline h-4 w-4 mr-2" />
                Clients ({clients.length})
              </button>
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/80" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn('pl-10', inputDark)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-amber-200/70 animate-pulse">Loading...</div>
          ) : !hasItems ? (
            <div className="text-center py-12 text-amber-200/60">
              {activeTab === 'projects' ? 'No projects found' : 'No clients found'}
            </div>
          ) : activeTab === 'projects' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: any, idx: number) => (
                <GameCard key={project.id} index={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-amber-100 line-clamp-2">{project.title}</h3>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium border shrink-0',
                          getProjectStatusStyle(project.status)
                        )}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="text-sm text-amber-200/80">
                      <p className="truncate" title={project.client?.email || project.client?.name}>
                        {project.client?.email || project.client?.name || 'N/A'}
                      </p>
                      <p className="text-amber-200/60">{project.company?.name || 'N/A'}</p>
                    </div>
                    <p className="text-lg font-bold text-amber-100">
                      {formatCurrency(project.budget)}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
                        onClick={() => navigate(`/admin/projects/${project.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className={btnOutline}
                        onClick={() => {}}
                        disabled
                        title="Edit coming soon"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className={btnOutline}
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deleteProjectMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </GameCard>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client: any, idx: number) => (
                <GameCard key={client.id} index={idx} className="p-4">
                  <div className="space-y-3">
                    <h3 className="font-bold text-amber-100">{client.name}</h3>
                    <div className="text-sm text-amber-200/80">
                      <p className="text-amber-200/60">{client.company?.name || 'N/A'}</p>
                      <p className="truncate mt-0.5">
                        {client.contactInfo && typeof client.contactInfo === 'object'
                          ? client.contactInfo.email || client.contactInfo.phone || 'N/A'
                          : 'N/A'}
                      </p>
                    </div>
                    <p className="text-sm text-amber-400">
                      {client._count?.invoices ?? 0} invoice(s)
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
                        onClick={() => navigate(`/admin/projects-clients/clients/${client.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className={btnOutline}
                        onClick={() => {}}
                        disabled
                        title="Edit coming soon"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className={btnOutline}
                        onClick={() => handleDeleteClient(client.id)}
                        disabled={deleteClientMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </GameCard>
              ))}
            </div>
          )}
        </div>
      </GamePanel>
    </div>
  );
}
