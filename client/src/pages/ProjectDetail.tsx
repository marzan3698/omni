import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { GamePanel } from '@/components/GamePanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProjectDetailContent, type ProjectDetailData } from '@/components/ProjectDetailContent';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ? parseInt(id, 10) : NaN;

  const { data, isLoading, error } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      if (!projectId || isNaN(projectId)) return null;
      const response = await adminApi.getProjectById(projectId);
      return response.data.data as ProjectDetailData;
    },
    enabled: !!projectId && !isNaN(projectId),
  });

  return (
    <div className="p-6 space-y-6">
      <GamePanel className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-amber-100">
                {isLoading ? 'Loading...' : data?.title || 'Project Details'}
              </h1>
              <p className="text-amber-200/80 text-sm mt-1">View project information, invoices, and payments</p>
            </div>
          </div>
          <Link to="/admin/projects">
            <Button variant="outline" className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20">
              Back to Projects
            </Button>
          </Link>
        </div>
      </GamePanel>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-amber-500/50 border-t-amber-400" />
          <p className="mt-4 text-amber-200/80">Loading project details...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">Failed to load project details</div>
      ) : !data ? (
        <div className="text-center py-12 text-amber-200/70">Project not found</div>
      ) : (
        <div className="space-y-6">
          <ProjectDetailContent data={data} projectId={projectId} />
        </div>
      )}
    </div>
  );
}
