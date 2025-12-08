import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { serviceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, DollarSign, Calendar } from 'lucide-react';

export function Services() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: servicesResponse, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await serviceApi.getAll();
      return response.data.data || [];
    },
  });

  const services = servicesResponse || [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => serviceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this service?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services</h1>
          <p className="text-slate-600 mt-1">Manage your digital marketing services</p>
        </div>
        <Button onClick={() => navigate('/services/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Service
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>All Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No services yet</div>
          ) : (
            <div className="grid gap-4">
              {services.map((service: any) => {
                const attributes = typeof service.attributes === 'string' 
                  ? JSON.parse(service.attributes) 
                  : service.attributes;
                return (
                  <div
                    key={service.id}
                    className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-slate-900">{service.title}</h3>
                          {!service.isActive && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Inactive</span>
                          )}
                        </div>
                        <p className="text-slate-600 mb-4">{service.details}</p>
                        <div className="flex gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-indigo-600" />
                            <span className="font-semibold text-indigo-600">
                              ${Number(service.pricing).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-600">
                              {new Date(service.deliveryStartDate).toLocaleDateString()} -{' '}
                              {new Date(service.deliveryEndDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {attributes?.tags && attributes.tags.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {attributes.tags.map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {attributes?.keyValuePairs && Object.keys(attributes.keyValuePairs).length > 0 && (
                          <div className="mt-3 space-y-1">
                            {Object.entries(attributes.keyValuePairs).map(([key, value]) => (
                              <div key={key} className="text-sm text-slate-600">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/services/${service.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(service.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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

