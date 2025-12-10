import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userApi, roleApi, companyApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { SignaturePad } from '@/components/SignaturePad';
import { CodeEditor } from '@/components/CodeEditor';
import { ArrowLeft, Save, Edit, CheckCircle, XCircle, Building2, Upload, Shield } from 'lucide-react';

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
    workHours?: number | null;
    holidays?: number | null;
    bonus?: string | null;
    responsibilities?: string | null;
    joinDate?: string | null;
  } | null;
}

// Utility function to get initials from email
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

// Utility function to get avatar background color
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

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = currentUser?.roleName === 'SuperAdmin';
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    education: '',
    profileImage: '',
    eSignature: '',
    roleId: 0,
    companyId: 0,
    designation: '',
    department: '',
    salary: '',
    workHours: '',
    holidays: '',
    bonus: '',
    responsibilities: '',
  });
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await userApi.getById(id!);
      return response.data.data as UserWithRole;
    },
    enabled: !!id,
  });

  // Fetch roles (for SuperAdmin only)
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await roleApi.getAll();
      return response.data.data || [];
    },
    enabled: isSuperAdmin && isEditing,
  });

  // Fetch companies (for SuperAdmin only)
  const { data: companiesResponse } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await companyApi.getAll();
      return response.data.data || [];
    },
    enabled: isSuperAdmin && isEditing,
  });

  const roles = rolesResponse || [];
  const companies = companiesResponse || [];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        address: user.address || '',
        education: user.education || '',
        profileImage: user.profileImage || '',
        eSignature: user.eSignature || '',
        roleId: user.roleId || 0,
        companyId: user.companyId || 0,
        designation: user.employee?.designation || '',
        department: user.employee?.department || '',
        salary: user.employee?.salary || '',
        workHours: user.employee?.workHours?.toString() || '',
        holidays: user.employee?.holidays?.toString() || '',
        bonus: user.employee?.bonus || '',
        responsibilities: user.employee?.responsibilities || '',
      });
      setProfileImagePreview(user.profileImage || null);
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return await userApi.update(id!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsEditing(false);
      alert('User updated successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update user');
    },
  });

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
        setFormData({ ...formData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (signature: string) => {
    setFormData({ ...formData, eSignature: signature });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updateData: any = {
      name: formData.name || null,
      email: formData.email,
      phone: formData.phone || null,
      address: formData.address || null,
      education: formData.education || null,
      profileImage: formData.profileImage || null,
      eSignature: formData.eSignature || null,
      designation: formData.designation || null,
      department: formData.department || null,
      salary: formData.salary ? parseFloat(formData.salary) : null,
      workHours: formData.workHours ? parseFloat(formData.workHours) : null,
      holidays: formData.holidays ? parseInt(formData.holidays) : null,
      bonus: formData.bonus ? parseFloat(formData.bonus) : null,
      responsibilities: formData.responsibilities || null,
    };
    if (formData.password) {
      updateData.password = formData.password;
    }
    if (isSuperAdmin && formData.roleId && formData.roleId > 0) {
      updateData.roleId = formData.roleId;
    }
    if (isSuperAdmin && formData.companyId && formData.companyId > 0) {
      updateData.companyId = formData.companyId;
    }
    updateUserMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">User not found</p>
        <Button onClick={() => navigate('/employees')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </Button>
      </div>
    );
  }

  const permissions = user.role?.permissions || {};
  const permissionEntries = Object.entries(permissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/employees')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isEditing ? 'Edit User' : 'User Details'}
            </h1>
            <p className="text-slate-600 mt-1">{user.email}</p>
          </div>
        </div>
        {isSuperAdmin && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit User
          </Button>
        )}
      </div>

      {!isEditing ? (
        /* View Mode */
        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name || user.email}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-full ${getAvatarColor(user.email)} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                    {getInitials(user.email, user.name)}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {user.name || user.email}
                  </h2>
                  <p className="text-slate-600 mt-1">{user.email}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800">
                      {user.role?.name || 'N/A'}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>{user.company?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isSuperAdmin && (
                  <div>
                    <Label className="text-sm font-medium text-slate-600">User ID</Label>
                    <p className="text-slate-900 mt-1 font-mono text-xs">{user.id}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-slate-600">Name</Label>
                  <p className="text-slate-900 mt-1">{user.name || '—'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Email</Label>
                  <p className="text-slate-900 mt-1">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Phone</Label>
                  <p className="text-slate-900 mt-1">{user.phone || '—'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Address</Label>
                  <p className="text-slate-900 mt-1 whitespace-pre-wrap">{user.address || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-slate-600">Education</Label>
                  <p className="text-slate-900 mt-1 whitespace-pre-wrap">{user.education || '—'}</p>
                </div>
                {user.createdAt && (
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Created At</Label>
                    <p className="text-slate-900 mt-1">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
                {user.updatedAt && (
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Last Updated</Label>
                    <p className="text-slate-900 mt-1">
                      {new Date(user.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* E-Signature */}
          {user.eSignature && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle>E-Signature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <img 
                    src={user.eSignature} 
                    alt="E-Signature" 
                    className="max-w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employee Details */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent>
              {user.employee ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user.employee.designation && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Designation</Label>
                        <p className="text-slate-900 mt-1">{user.employee.designation}</p>
                      </div>
                    )}
                    {user.employee.department && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Department</Label>
                        <p className="text-slate-900 mt-1">{user.employee.department}</p>
                      </div>
                    )}
                    {user.employee.salary && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Salary</Label>
                        <p className="text-slate-900 mt-1 font-medium">
                          ${Number(user.employee.salary).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {user.employee.workHours && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Work Hours</Label>
                        <p className="text-slate-900 mt-1">{Number(user.employee.workHours)} hours/week</p>
                      </div>
                    )}
                    {user.employee.holidays && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Holidays</Label>
                        <p className="text-slate-900 mt-1">{user.employee.holidays} days/year</p>
                      </div>
                    )}
                    {user.employee.bonus && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Bonus</Label>
                        <p className="text-slate-900 mt-1 font-medium">
                          ${Number(user.employee.bonus).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {user.employee.joinDate && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Join Date</Label>
                        <p className="text-slate-900 mt-1">
                          {new Date(user.employee.joinDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                  {user.employee.responsibilities && (
                    <div className="mt-6">
                      <Label className="text-sm font-medium text-slate-600 mb-2 block">Job Responsibilities</Label>
                      <div className="bg-slate-50 border border-gray-200 rounded-lg p-4">
                        <pre className="text-sm font-mono whitespace-pre-wrap text-slate-900">
                          {user.employee.responsibilities}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500 text-sm">No employee information available. Add details in edit mode.</p>
              )}
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {permissionEntries.length === 0 ? (
                <p className="text-slate-500">No permissions defined</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissionEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                        value
                          ? 'bg-green-50 border-green-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {value ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-400" />
                      )}
                      <span className={`text-sm ${value ? 'text-green-900 font-medium' : 'text-slate-600'}`}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Edit Mode */
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Edit User Information</CardTitle>
            <CardDescription>Update user details below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div>
                <Label htmlFor="profileImage">Profile Image</Label>
                <div className="mt-2 flex items-center gap-4">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full ${getAvatarColor(user.email)} flex items-center justify-center text-white font-bold text-xl`}>
                      {getInitials(user.email, formData.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Upload a new profile image (JPG, PNG, etc.)
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Role Selection - SuperAdmin only */}
              {isSuperAdmin && (
                <div>
                  <Label htmlFor="roleId">Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      id="roleId"
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      required
                    >
                      <option value={0}>Select a role</option>
                      {roles.map((role: any) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Company Selection - SuperAdmin only */}
              {isSuperAdmin && (
                <div>
                  <Label htmlFor="companyId">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      id="companyId"
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: parseInt(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      required
                    >
                      <option value={0}>Select a company</option>
                      {companies.map((company: any) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address">Address</Label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter address"
                />
              </div>

              {/* Education */}
              <div>
                <Label htmlFor="education">Education</Label>
                <textarea
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter education details"
                />
              </div>

              {/* Employee Section Divider */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Employee Information</h3>
              </div>

              {/* Designation */}
              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g., Senior Developer, Marketing Manager"
                />
              </div>

              {/* Department */}
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Engineering, Marketing, Sales"
                />
              </div>

              {/* Salary */}
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Enter annual salary"
                />
              </div>

              {/* Work Hours */}
              <div>
                <Label htmlFor="workHours">Work Hours (per week)</Label>
                <Input
                  id="workHours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="168"
                  value={formData.workHours}
                  onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
                  placeholder="e.g., 40"
                />
              </div>

              {/* Holidays */}
              <div>
                <Label htmlFor="holidays">Holidays (per year)</Label>
                <Input
                  id="holidays"
                  type="number"
                  min="0"
                  value={formData.holidays}
                  onChange={(e) => setFormData({ ...formData, holidays: e.target.value })}
                  placeholder="e.g., 20"
                />
              </div>

              {/* Bonus */}
              <div>
                <Label htmlFor="bonus">Bonus</Label>
                <Input
                  id="bonus"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.bonus}
                  onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                  placeholder="Enter bonus amount"
                />
              </div>

              {/* Job Responsibilities - Code Editor */}
              <div>
                <CodeEditor
                  value={formData.responsibilities}
                  onChange={(value) => setFormData({ ...formData, responsibilities: value })}
                  placeholder="Describe the employee's responsibilities, duties, and what they will do in the company..."
                  language="markdown"
                  rows={12}
                />
              </div>

              {/* E-Signature */}
              <div>
                <Label>E-Signature</Label>
                <div className="mt-2">
                  {formData.eSignature && (
                    <div className="mb-4 border border-gray-200 rounded-lg p-4 bg-white">
                      <p className="text-sm text-slate-600 mb-2">Current Signature:</p>
                      <img 
                        src={formData.eSignature} 
                        alt="Current signature" 
                        className="max-w-full h-auto border border-gray-300 rounded"
                      />
                    </div>
                  )}
                  <div className="border border-gray-300 rounded-lg p-4 bg-slate-50">
                    <p className="text-sm text-slate-600 mb-2">Draw new signature:</p>
                    <SignaturePad onSignatureChange={handleSignatureChange} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data
                    if (user) {
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        password: '',
                        address: user.address || '',
                        education: user.education || '',
                        profileImage: user.profileImage || '',
                        eSignature: user.eSignature || '',
                        roleId: user.roleId || 0,
                        companyId: user.companyId || 0,
                        designation: user.employee?.designation || '',
                        department: user.employee?.department || '',
                        salary: user.employee?.salary || '',
                        workHours: user.employee?.workHours?.toString() || '',
                        holidays: user.employee?.holidays?.toString() || '',
                        bonus: user.employee?.bonus || '',
                        responsibilities: user.employee?.responsibilities || '',
                      });
                      setProfileImagePreview(user.profileImage || null);
                    }
                  }}
                  disabled={updateUserMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

