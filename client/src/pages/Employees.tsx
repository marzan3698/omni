import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { employeeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Plus } from 'lucide-react';

export function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.companyId) {
      loadEmployees();
    }
  }, [user]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getAll(user!.companyId!);
      if (response.data.success) {
        setEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-600 mt-1">Manage your team</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <Card key={employee.id} className="shadow-sm border-gray-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-indigo-600" />
                    <div>
                      <CardTitle className="text-lg">{employee.user?.email}</CardTitle>
                      <p className="text-sm text-slate-500">{employee.designation || 'Employee'}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {employee.department && <p className="text-slate-600">📁 {employee.department}</p>}
                    {employee.salary && <p className="text-slate-600">💰 ${Number(employee.salary).toLocaleString()}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {employees.length === 0 && (
            <div className="text-center py-12 text-slate-500">No employees found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

