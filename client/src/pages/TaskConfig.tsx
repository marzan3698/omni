import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ListChecks, Info } from 'lucide-react';

// Task priorities (enum - fixed)
const taskPriorities = ['Low', 'Medium', 'High'];

// Task statuses (enum - fixed)
const taskStatuses = ['Todo', 'InProgress', 'Done'];

export default function TaskConfig() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ListChecks className="h-8 w-8" />
          Task Configuration
        </h1>
        <p className="text-gray-600 mt-1">View task categories and statuses (read-only)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Priorities */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Task Priorities</CardTitle>
            <CardDescription>Available priority levels for tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {taskPriorities.map((priority) => (
                <div
                  key={priority}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                >
                  <span className="font-medium text-gray-700">{priority}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      priority === 'High'
                        ? 'bg-red-100 text-red-700'
                        : priority === 'Medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {priority === 'High' ? 'Urgent' : priority === 'Medium' ? 'Normal' : 'Low Priority'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Task priorities are system-defined and cannot be modified. These are enum values in the database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Statuses */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Task Statuses</CardTitle>
            <CardDescription>Available status options for tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {taskStatuses.map((status) => (
                <div
                  key={status}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                >
                  <span className="font-medium text-gray-700">{status}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      status === 'Done'
                        ? 'bg-green-100 text-green-700'
                        : status === 'InProgress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {status === 'Done' ? 'Completed' : status === 'InProgress' ? 'Active' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Task statuses are system-defined and cannot be modified. These are enum values in the database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card className="mt-6 shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>About Task Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Task priorities and statuses are defined as enums in the database schema. This ensures consistency
              across the system and prevents invalid values.
            </p>
            <p>
              <strong>Priorities:</strong> Used to indicate the urgency of a task. High priority tasks should be
              addressed first.
            </p>
            <p>
              <strong>Statuses:</strong> Track the progress of tasks through their lifecycle from creation to
              completion.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Note: Only SuperAdmin can view this configuration page. To modify these values, database schema
              changes would be required.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

