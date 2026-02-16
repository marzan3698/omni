import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { Plus, Search, Eye, Trash2, FolderKanban, Briefcase, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function ProjectList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects', searchTerm, statusFilter, user?.companyId],
    queryFn: async () => {
      const response = await adminApi.getAllProjects({
        companyId: user?.companyId,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      });
      return response.data.data || [];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'InProgress': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
      case 'Submitted': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
      case 'StartedWorking': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Draft': return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
      case 'Cancelled': return 'bg-red-500/20 text-red-300 border-red-500/40';
      default: return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
    }
  };

  const btnOutline = 'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40';

  const projectCount = projects?.length ?? 0;
  const completedCount = projects?.filter((p: any) => p.status === 'Completed').length ?? 0;
  const inProgressCount = projects?.filter((p: any) => p.status === 'InProgress').length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <GamePanel className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
              <FolderKanban className="h-8 w-8 text-amber-400" />
              Project List
            </h1>
            <p className="text-amber-200/80 mt-1">Manage projects and add invoices/payments</p>
          </div>
          <Link to="/admin/projects/new">
            <Button className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </Link>
        </div>
      </GamePanel>

      {/* Stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GameCard index={0} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{projectCount}</p>
              <p className="text-xs text-amber-200/60 mt-0.5">projects</p>
            </div>
            <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10">
              <FolderKanban className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={1} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{inProgressCount}</p>
            </div>
            <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10">
              <Briefcase className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={2} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{completedCount}</p>
            </div>
            <div className="p-3 rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </GameCard>
      </div>

      {/* Filters */}
      <GamePanel>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/80" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn('pl-10', inputDark)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn('px-3 py-2 rounded-lg min-w-[140px]', inputDark)}
            >
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-amber-200/70">Loading...</div>
          ) : !projects?.length ? (
            <div className="text-center py-12 text-amber-200/60">
              No projects found.
              <br />
              <Link to="/admin/projects/new" className="text-amber-400 hover:text-amber-300 underline mt-2 inline-block">
                Create your first project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: any, idx: number) => (
                <GameCard key={project.id} index={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-amber-100 line-clamp-2">{project.title}</h3>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium border shrink-0', getStatusStyle(project.status))}>
                        {project.status}
                      </span>
                    </div>
                    <div className="text-sm text-amber-200/80">
                      <p className="truncate" title={project.client?.email || project.client?.name}>
                        {project.client?.email || project.client?.name || 'N/A'}
                      </p>
                      <p className="text-amber-200/60">{project.service?.title || 'N/A'}</p>
                    </div>
                    <p className="text-lg font-bold text-amber-100">{formatCurrency(project.budget)}</p>
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
                        onClick={() => handleDelete(project.id)}
                        disabled={deleteMutation.isPending}
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
