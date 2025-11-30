import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { taskApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckSquare, Plus, Circle, Clock, CheckCircle2 } from 'lucide-react';

export function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.companyId) {
      loadTasks();
    }
  }, [user, filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filter !== 'all') {
        filters.status = filter;
      }
      const response = await taskApi.getAll(user!.companyId!, filters);
      if (response.data.success) {
        setTasks(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Todo':
        return <Circle className="w-4 h-4 text-slate-400" />;
      case 'InProgress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Done':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-600 mt-1">Manage your tasks</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
          All
        </Button>
        <Button variant={filter === 'Todo' ? 'default' : 'outline'} onClick={() => setFilter('Todo')}>
          Todo
        </Button>
        <Button variant={filter === 'InProgress' ? 'default' : 'outline'} onClick={() => setFilter('InProgress')}>
          In Progress
        </Button>
        <Button variant={filter === 'Done' ? 'default' : 'outline'} onClick={() => setFilter('Done')}>
          Done
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="shadow-sm border-gray-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        {task.description && (
                          <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm text-slate-600">
                      {task.priority && (
                        <span className={`px-2 py-1 rounded ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                      {task.assignedEmployee && (
                        <span>👤 {task.assignedEmployee.user?.email}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {tasks.length === 0 && (
            <div className="text-center py-12 text-slate-500">No tasks found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

