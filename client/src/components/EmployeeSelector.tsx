import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi, employeeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, User, Check, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employee {
  id: number;
  userId?: string;
  designation?: string | null;
  department?: string | null;
  user?: {
    id: string;
    email: string;
    name?: string | null;
    company?: {
      id: number;
      name: string;
    };
  };
  // For SuperAdmin view
  email?: string;
  name?: string | null;
  companyName?: string;
  company?: {
    id: number;
    name: string;
  };
}

interface EmployeeSelectorProps {
  companyId: number;
  selectedEmployeeIds: number[];
  onSelectionChange: (employeeIds: number[]) => void;
  isSuperAdmin?: boolean;
}

export function EmployeeSelector({
  companyId,
  selectedEmployeeIds,
  onSelectionChange,
  isSuperAdmin = false,
}: EmployeeSelectorProps) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch employees - For SuperAdmin: fetch all users (non-clients), for others: fetch company employees
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees-selector', companyId, isSuperAdmin, debouncedSearchTerm],
    queryFn: async () => {
      if (isSuperAdmin) {
        // SuperAdmin: Fetch all users (excluding clients) and get their employee records
        const response = await userApi.getAll();
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch users');
        }
        const allUsers = (response.data.data || []) as any[];
        const nonClientUsers = allUsers.filter((u) => u.role?.name !== 'Client');
        
        // Map to employee format - include all users that have employee records
        const employees: Employee[] = [];
        for (const user of nonClientUsers) {
          // Only include users that have an employee record
          if (user.employee && user.employee.id) {
            employees.push({
              id: user.employee.id,
              userId: user.id,
              designation: user.employee.designation || null,
              department: user.employee.department || null,
              user: {
                id: user.id,
                email: user.email,
                name: user.name || null,
                company: user.company || null,
              },
              email: user.email,
              name: user.name || null,
              companyName: user.company?.name || null,
              company: user.company || null,
            });
          }
        }
        
        // Filter by search term if provided
        if (debouncedSearchTerm.trim()) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          return employees.filter((emp) => {
            const name = emp.name || emp.user?.name || '';
            const email = emp.email || emp.user?.email || '';
            const designation = emp.designation || '';
            const department = emp.department || '';
            return (
              name.toLowerCase().includes(searchLower) ||
              email.toLowerCase().includes(searchLower) ||
              designation.toLowerCase().includes(searchLower) ||
              department.toLowerCase().includes(searchLower)
            );
          });
        }
        
        return employees;
      } else {
        // Regular users: Fetch employees from their company
        if (!companyId) {
          return [];
        }
        const response = await employeeApi.getAll(companyId);
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch employees');
        }
        const employees = (response.data.data || []) as any[];
        
        // Filter by search term if provided
        if (debouncedSearchTerm.trim()) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          return employees.filter((emp: any) => {
            const name = emp.user?.name || '';
            const email = emp.user?.email || '';
            const designation = emp.designation || '';
            const department = emp.department || '';
            return (
              name.toLowerCase().includes(searchLower) ||
              email.toLowerCase().includes(searchLower) ||
              designation.toLowerCase().includes(searchLower) ||
              department.toLowerCase().includes(searchLower)
            );
          });
        }
        
        return employees;
      }
    },
    enabled: true, // Always enabled - will handle companyId inside queryFn if needed
  });

  const employees = employeesData || [];
  
  // Memoize selected employees for display
  const selectedEmployees = useMemo(() => {
    return employees.filter((emp) => selectedEmployeeIds.includes(emp.id));
  }, [employees, selectedEmployeeIds]);

  const handleToggleEmployee = (employeeId: number) => {
    if (selectedEmployeeIds.includes(employeeId)) {
      onSelectionChange(selectedEmployeeIds.filter((id) => id !== employeeId));
    } else {
      onSelectionChange([...selectedEmployeeIds, employeeId]);
    }
  };

  const handleRemoveEmployee = (employeeId: number) => {
    onSelectionChange(selectedEmployeeIds.filter((id) => id !== employeeId));
  };

  const getEmployeeDisplayName = (employee: Employee) => {
    return employee.name || employee.user?.name || employee.email || employee.user?.email || 'Unknown';
  };

  const getEmployeeEmail = (employee: Employee) => {
    return employee.email || employee.user?.email || '';
  };

  const getEmployeeCompany = (employee: Employee) => {
    return employee.companyName || employee.company?.name || employee.user?.company?.name || '';
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search employees by name, email, designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Employees */}
      {selectedEmployeeIds.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">
            Selected Employees ({selectedEmployeeIds.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-sm"
              >
                <User className="w-3 h-3" />
                <span>{getEmployeeDisplayName(employee)}</span>
                {isSuperAdmin && getEmployeeCompany(employee) && (
                  <span className="text-xs bg-indigo-200 px-1.5 py-0.5 rounded">
                    {getEmployeeCompany(employee)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveEmployee(employee.id)}
                  className="ml-1 hover:text-indigo-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {(debouncedSearchTerm.trim() || employees.length > 0) && (
        <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {debouncedSearchTerm.trim()
                ? `No employees found for "${debouncedSearchTerm}"`
                : 'No employees available'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {employees.map((employee) => {
                const isSelected = selectedEmployeeIds.includes(employee.id);
                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => handleToggleEmployee(employee.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors',
                      isSelected && 'bg-indigo-50'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div
                        className={cn(
                          'w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0',
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {getEmployeeDisplayName(employee)}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {getEmployeeEmail(employee)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {employee.designation && (
                            <span className="text-xs text-slate-400">
                              {employee.designation}
                            </span>
                          )}
                          {employee.department && (
                            <>
                              {employee.designation && <span className="text-xs text-slate-300">•</span>}
                              <span className="text-xs text-slate-400">
                                {employee.department}
                              </span>
                            </>
                          )}
                          {isSuperAdmin && getEmployeeCompany(employee) && (
                            <>
                              {(employee.designation || employee.department) && (
                                <span className="text-xs text-slate-300">•</span>
                              )}
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Building2 className="w-3 h-3" />
                                <span>{getEmployeeCompany(employee)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!debouncedSearchTerm.trim() && selectedEmployeeIds.length === 0 && employees.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          {isSuperAdmin
            ? 'Type to search for employees across all companies'
            : 'Type to search for employees in your company'}
        </div>
      )}
    </div>
  );
}

