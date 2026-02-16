import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GamePanel } from '@/components/GamePanel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { employeeApi, userApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AddEmployeeModal } from '@/components/AddEmployeeModal';
import { Users, Plus, Building2, Eye, Edit } from 'lucide-react';

interface UserWithRole {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  education?: string | null;
  roleId: number;
  companyId: number;
  profileImage?: string | null;
  eSignature?: string | null;
  createdAt?: string;
  updatedAt?: string;
  role: {
    id: number;
    name: string;
    permissions: Record<string, boolean>;
  };
  company: {
    id: number;
    name: string;
  };
  employee?: {
    id: number;
    designation?: string | null;
    department?: string | null;
    salary?: string | null;
    joinDate?: string | null;
  } | null;
}

// Utility function to get initials from email or name
const getInitials = (email: string, name?: string | null): string => {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

// Utility function to get avatar background color based on email
const getAvatarColor = (email: string): string => {
  const colors = [
    'bg-indigo-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];
  const index = email.charCodeAt(0) % colors.length;
  return colors[index];
};

export function Employees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.roleName === 'SuperAdmin';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // For SuperAdmin: fetch all users and filter out clients
  // For others: fetch employees as before
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users', isSuperAdmin],
    queryFn: async () => {
      if (isSuperAdmin) {
        const response = await userApi.getAll();
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch users');
        }
        // Filter out users with role "Client" and only include users with employee records
        const allUsers = (response.data.data || []) as UserWithRole[];
        // Only show users that are not clients and have employee records
        return allUsers.filter((u) => {
          const roleName = u.role?.name || '';
          return roleName !== 'Client' && u.employee && u.employee.id;
        });
      }
      return [];
    },
    enabled: isSuperAdmin,
  });

  const { data: employeesResponse, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId || isSuperAdmin) return null;
      const response = await employeeApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: !isSuperAdmin && !!user?.companyId,
  });

  const loading = isSuperAdmin ? usersLoading : employeesLoading;
  
  // Format data for display - keep full user data for modals
  const displayData = isSuperAdmin
    ? (usersResponse || []).map((userData: UserWithRole) => ({
        ...userData,
        id: userData.id,
        email: userData.email,
        roleName: userData.role.name,
        companyName: userData.company.name,
        designation: userData.employee?.designation || null,
        department: userData.employee?.department || null,
        salary: userData.employee?.salary || null,
        profileImage: userData.profileImage,
      }))
    : (employeesResponse || []).map((employee: any) => {
        const userData = employee.user;
        return {
          id: userData?.id || employee.id,
          email: userData?.email || 'N/A',
          roleName: userData?.role?.name || 'Employee',
          companyName: user?.companyId ? 'Current Company' : 'N/A',
          designation: employee.designation || null,
          department: employee.department || null,
          salary: employee.salary || null,
          profileImage: userData?.profileImage,
          role: userData?.role || { id: 0, name: 'Employee', permissions: {} },
          company: { id: user?.companyId || 0, name: 'Current Company' },
          roleId: userData?.roleId || 0,
          companyId: user?.companyId || 0,
          employee: {
            id: employee.id,
            designation: employee.designation,
            department: employee.department,
            salary: employee.salary,
            joinDate: employee.joinDate,
          },
        };
      });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const headerClass = isSuperAdmin ? 'p-4 rounded-xl border border-amber-500/20 bg-slate-800/40' : '';
  const titleClass = isSuperAdmin ? 'text-amber-100' : 'text-slate-900';
  const subtitleClass = isSuperAdmin ? 'text-amber-200/80' : 'text-slate-600';
  const btnClass = isSuperAdmin ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50' : '';

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${headerClass}`}>
        <div>
          <h1 className={`text-3xl font-bold ${titleClass}`}>
            {isSuperAdmin ? 'All Users' : 'Employees'}
          </h1>
          <p className={`${subtitleClass} mt-1`}>
            {isSuperAdmin ? 'View all users and their roles (excluding clients)' : 'Manage your team'}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className={btnClass}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {isSuperAdmin ? (
        <GamePanel>
          <div className="p-0">
          {displayData.length === 0 ? (
            <div className={`text-center py-12 ${isSuperAdmin ? 'text-amber-200/70' : 'text-slate-500'}`}>
              {isSuperAdmin ? 'No users found (excluding clients)' : 'No employees found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isSuperAdmin ? 'bg-slate-800/60 border-b border-amber-500/20' : 'bg-slate-50 border-b border-gray-200'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSuperAdmin ? 'text-amber-200/90' : 'text-slate-700'}`}>
                      User
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSuperAdmin ? 'text-amber-200/90' : 'text-slate-700'}`}>
                      Role
                    </th>
                    {isSuperAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-200/90 uppercase tracking-wider">
                        Company
                      </th>
                    )}
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSuperAdmin ? 'text-amber-200/90' : 'text-slate-700'}`}>Designation</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSuperAdmin ? 'text-amber-200/90' : 'text-slate-700'}`}>Department</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSuperAdmin ? 'text-amber-200/90' : 'text-slate-700'}`}>Salary</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSuperAdmin ? 'text-amber-200/90' : 'text-slate-700'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={isSuperAdmin ? 'divide-y divide-amber-500/10' : 'bg-white divide-y divide-gray-200'}>
                  {displayData.map((item) => (
                    <tr key={item.id} className={isSuperAdmin ? 'hover:bg-amber-500/5 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {item.profileImage ? (
                            <img
                              src={item.profileImage}
                              alt={item.email}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(item.email)} flex items-center justify-center text-white font-semibold text-sm`}>
                              {getInitials(item.email, (item as UserWithRole).name)}
                            </div>
                          )}
                          <div>
                            <div className={`text-sm font-medium ${isSuperAdmin ? 'text-amber-100' : 'text-slate-900'}`}>{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${isSuperAdmin ? 'bg-amber-500/25 text-amber-200 border border-amber-500/30' : 'bg-indigo-100 text-indigo-800'}`}>
                          {item.roleName}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-amber-200/80">
                            <Building2 className="w-4 h-4" />
                            <span>{item.companyName}</span>
                          </div>
                        </td>
                      )}
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSuperAdmin ? 'text-amber-200/80' : 'text-slate-600'}`}>
                        {item.designation || <span className={isSuperAdmin ? 'text-amber-200/50' : 'text-slate-400'}>—</span>}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSuperAdmin ? 'text-amber-200/80' : 'text-slate-600'}`}>
                        {item.department || <span className={isSuperAdmin ? 'text-amber-200/50' : 'text-slate-400'}>—</span>}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSuperAdmin ? 'text-amber-200/80' : 'text-slate-600'}`}>
                        {item.salary ? (
                          <span className="font-medium">৳{Number(item.salary).toLocaleString()}</span>
                        ) : (
                          <span className={isSuperAdmin ? 'text-amber-200/50' : 'text-slate-400'}>—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/employees/${item.id}`)}
                            className={isSuperAdmin ? 'h-8 px-3 border-amber-500/50 text-amber-100 hover:bg-amber-500/20' : 'h-8 px-3'}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/employees/${item.id}?edit=true`)}
                              className="h-8 px-3 border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GamePanel>
      ) : (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-0">
          {displayData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No employees found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {item.profileImage ? (
                            <img src={item.profileImage} alt={item.email} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(item.email)} flex items-center justify-center text-white font-semibold text-sm`}>
                              {getInitials(item.email, (item as UserWithRole).name)}
                            </div>
                          )}
                          <div className="text-sm font-medium text-slate-900">{item.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">{item.roleName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.designation || <span className="text-slate-400">—</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.department || <span className="text-slate-400">—</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {item.salary ? <span className="font-medium">৳{Number(item.salary).toLocaleString()}</span> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/employees/${item.id}`)} className="h-8 px-3">
                          <Eye className="w-4 h-4 mr-1" />View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </CardContent>
        </Card>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
