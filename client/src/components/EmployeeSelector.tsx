import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi, employeeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, User, Check, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** FIFA-style rating (70-99) from employee id for visual flair */
function getFifaRating(employeeId: number): number {
  return (employeeId % 30) + 70;
}

interface Employee {
  id: number;
  userId?: string;
  designation?: string | null;
  department?: string | null;
  user?: {
    id: string;
    email: string;
    name?: string | null;
    profileImage?: string | null;
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
  /** Employee IDs that cannot be selected (e.g. booked for a time slot) */
  disabledEmployeeIds?: number[];
  /** Optional reason per employee (e.g. "Booked" for availability) */
  disabledReasonByEmployeeId?: Record<number, string>;
  /** 'fifa' = FIFA player card style grid (for Lead Detail Assignment), 'default' = list */
  variant?: 'default' | 'fifa';
}

export function EmployeeSelector({
  companyId,
  selectedEmployeeIds,
  onSelectionChange,
  isSuperAdmin = false,
  disabledEmployeeIds = [],
  disabledReasonByEmployeeId = {},
  variant = 'default',
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
    if (disabledEmployeeIds.includes(employeeId)) return;
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

  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40';
  const isFifa = variant === 'fifa';

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className={cn('absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4', isFifa ? 'text-amber-400/80' : 'text-slate-400')} />
        <Input
          type="text"
          placeholder="Search employees by name, email, designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn('pl-10', isFifa && inputDark)}
        />
      </div>

      {/* Selected Employees */}
      {selectedEmployeeIds.length > 0 && (
        <div className="space-y-2">
          <div className={cn('text-sm font-medium', isFifa ? 'text-amber-200/80' : 'text-slate-700')}>
            Selected ({selectedEmployeeIds.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedEmployees.map((employee) => (
              <div
                key={employee.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
                  isFifa
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'bg-indigo-100 text-indigo-700'
                )}
              >
                <User className="w-3 h-3" />
                <span>{getEmployeeDisplayName(employee)}</span>
                {isSuperAdmin && getEmployeeCompany(employee) && (
                  <span className={cn('text-xs px-1.5 py-0.5 rounded', isFifa ? 'bg-amber-500/30' : 'bg-indigo-200')}>
                    {getEmployeeCompany(employee)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveEmployee(employee.id)}
                  className={cn('ml-1', isFifa ? 'hover:text-amber-100' : 'hover:text-indigo-900')}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results - FIFA Player Cards */}
      {isFifa && (debouncedSearchTerm.trim() || employees.length > 0) && (
        <div className="max-h-[420px] overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="p-6 text-center text-amber-200/70 text-sm">Loading players...</div>
          ) : employees.length === 0 ? (
            <div className="p-6 text-center text-amber-200/60 text-sm">
              {debouncedSearchTerm.trim() ? `No players found for "${debouncedSearchTerm}"` : 'No players available'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employees.map((employee) => {
                const isSelected = selectedEmployeeIds.includes(employee.id);
                const isDisabled = disabledEmployeeIds.includes(employee.id);
                const disabledReason = disabledReasonByEmployeeId[employee.id] ?? 'Booked';
                const rating = getFifaRating(employee.id);
                const photoUrl = employee.user?.profileImage;
                const displayName = getEmployeeDisplayName(employee);
                return (
                  <div key={employee.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleEmployee(employee.id)}
                      disabled={isDisabled}
                      className={cn(
                        'relative w-full text-left rounded-lg overflow-hidden transition-all duration-200',
                        'border-2 bg-gradient-to-b from-slate-800/95 to-slate-900/98',
                        'hover:shadow-md hover:border-amber-500/60',
                        isSelected && !isDisabled && 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg',
                        !isSelected && !isDisabled && 'border-amber-500/30',
                        isDisabled && 'opacity-60 cursor-not-allowed border-slate-600'
                      )}
                    >
                    {/* FIFA Card - top stripe (position/team) */}
                    <div
                      className={cn(
                        'h-6 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider px-2 truncate',
                        'bg-gradient-to-r from-amber-600/90 via-amber-500 to-amber-600/90',
                        'text-amber-950'
                      )}
                      title={employee.designation || employee.department || 'TEAM'}
                    >
                      {employee.designation || employee.department || 'TEAM'}
                    </div>
                    {/* Photo area */}
                    <div className="relative h-20 flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900/95 p-2">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={displayName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/40 shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-amber-500/30 border-2 border-amber-500/40 flex items-center justify-center text-2xl font-bold text-amber-200">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Rating badge */}
                      <div className="absolute bottom-1 right-2 w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-sm font-black text-amber-950 shadow-md border border-amber-400/50">
                        {rating}
                      </div>
                    </div>
                    {/* Name & details */}
                    <div className="px-2.5 pb-2.5 pt-1.5 min-w-0 overflow-hidden">
                      <div className="font-bold text-amber-100 text-sm line-clamp-2 break-words leading-tight" title={displayName}>{displayName}</div>
                      <div className="text-[11px] text-amber-200/80 line-clamp-1 mt-1" title={getEmployeeEmail(employee)}>{getEmployeeEmail(employee)}</div>
                      {employee.department && employee.department !== (employee.designation || '') && (
                        <div className="text-[9px] text-amber-400/60 mt-0.5">{employee.department}</div>
                      )}
                      {isDisabled && (
                        <span className="inline-block mt-1 text-[9px] font-medium bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded">
                          {disabledReason}
                        </span>
                      )}
                    </div>
                    {/* Selected check overlay */}
                    {isSelected && !isDisabled && (
                      <div className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-emerald-400">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Search Results - Default List */}
      {!isFifa && (debouncedSearchTerm.trim() || employees.length > 0) && (
        <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {debouncedSearchTerm.trim() ? `No employees found for "${debouncedSearchTerm}"` : 'No employees available'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {employees.map((employee) => {
                const isSelected = selectedEmployeeIds.includes(employee.id);
                const isDisabled = disabledEmployeeIds.includes(employee.id);
                const disabledReason = disabledReasonByEmployeeId[employee.id] ?? 'Booked';
                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => handleToggleEmployee(employee.id)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full flex items-center justify-between p-3 transition-colors text-left',
                      isDisabled && 'cursor-not-allowed opacity-70 bg-slate-50',
                      !isDisabled && 'hover:bg-gray-50',
                      isSelected && !isDisabled && 'bg-indigo-50'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={cn(
                          'w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0',
                          isDisabled && 'border-slate-200 bg-slate-100',
                          isSelected && !isDisabled && 'border-indigo-600 bg-indigo-600',
                          !isSelected && !isDisabled && 'border-gray-300'
                        )}
                      >
                        {isSelected && !isDisabled && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{getEmployeeDisplayName(employee)}</div>
                        <div className="text-xs text-slate-500 truncate">{getEmployeeEmail(employee)}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {employee.designation && <span className="text-xs text-slate-400">{employee.designation}</span>}
                          {employee.department && (
                            <>
                              {employee.designation && <span className="text-xs text-slate-300">•</span>}
                              <span className="text-xs text-slate-400">{employee.department}</span>
                            </>
                          )}
                          {isDisabled && (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{disabledReason}</span>
                          )}
                          {isSuperAdmin && getEmployeeCompany(employee) && (
                            <>
                              {(employee.designation || employee.department || isDisabled) && (
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
        <div className={cn('text-center py-8 text-sm', isFifa ? 'text-amber-200/60' : 'text-slate-500')}>
          {isSuperAdmin ? 'Type to search for employees across all companies' : 'Type to search for employees in your company'}
        </div>
      )}
    </div>
  );
}

