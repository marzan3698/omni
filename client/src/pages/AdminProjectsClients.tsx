import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search, Eye } from 'lucide-react';
import { ClientDetailModal } from '@/components/ClientDetailModal';

export function AdminProjectsClients() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'projects' | 'clients'>('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const { data: projectsResponse, isLoading: loadingProjects } = useQuery({
    queryKey: ['admin-projects', searchTerm],
    queryFn: async () => {
      const response = await adminApi.getAllProjects({ search: searchTerm || undefined });
      return response.data.data || [];
    },
  });

  const { data: clientsResponse, isLoading: loadingClients } = useQuery({
    queryKey: ['admin-clients', searchTerm],
    queryFn: async () => {
      const response = await adminApi.getAllClients({ search: searchTerm || undefined });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Projects & Clients</h1>
        <p className="text-slate-600 mt-1">Manage all projects and clients</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'projects' ? 'default' : 'outline'}
                onClick={() => setActiveTab('projects')}
              >
                Projects ({projects.length})
              </Button>
              <Button
                variant={activeTab === 'clients' ? 'default' : 'outline'}
                onClick={() => setActiveTab('clients')}
              >
                Clients ({clients.length})
              </Button>
            </div>
            <div className="flex gap-2 w-64">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'projects' ? (
            <div className="space-y-4">
              {loadingProjects ? (
                <div className="text-center py-8">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No projects found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Title</th>
                        <th className="text-left p-2">Client</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-left p-2">Budget</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project: any) => (
                        <tr key={project.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{project.title}</td>
                          <td className="p-2">{project.client?.email || 'N/A'}</td>
                          <td className="p-2">{project.company?.name || 'N/A'}</td>
                          <td className="p-2">${Number(project.budget).toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              project.status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                              project.status === 'Submitted' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => navigate(`/admin/projects/${project.id}`)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {/* TODO: Edit modal */}}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteProject(project.id)}
                                disabled={deleteProjectMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {loadingClients ? (
                <div className="text-center py-8">Loading...</div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No clients found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-left p-2">Contact Info</th>
                        <th className="text-left p-2">Invoices</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client: any) => (
                        <tr key={client.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{client.name}</td>
                          <td className="p-2">{client.company?.name || 'N/A'}</td>
                          <td className="p-2">
                            {client.contactInfo && typeof client.contactInfo === 'object'
                              ? client.contactInfo.email || client.contactInfo.phone || 'N/A'
                              : 'N/A'}
                          </td>
                          <td className="p-2">{client._count?.invoices || 0}</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setSelectedClientId(client.id)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {/* TODO: Edit modal */}}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClient(client.id)}
                                disabled={deleteClientMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Detail Modal */}
      {selectedClientId && (
        <ClientDetailModal
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}

    </div>
  );
}

