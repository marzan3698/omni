import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignaturePad } from '@/components/SignaturePad';
import { CodeEditor } from '@/components/CodeEditor';
import { userApi, roleApi, companyApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, ChevronRight, ChevronLeft, Check, User, Mail, Lock, Phone, MapPin, GraduationCap, Shield, Building2, Briefcase, DollarSign, Clock, Calendar, Gift, Code2, Image as ImageIcon, PenTool } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1, title: 'Basic Information', icon: User },
  { id: 2, title: 'Personal Details', icon: MapPin },
  { id: 3, title: 'Role & Company', icon: Shield },
  { id: 4, title: 'Employee Details', icon: Briefcase },
  { id: 5, title: 'Additional Info', icon: ImageIcon },
];

export function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roleName === 'SuperAdmin';
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Step 2: Personal Details
    address: '',
    education: '',
    
    // Step 3: Role & Company
    roleId: 0,
    companyId: currentUser?.companyId || 0,
    
    // Step 4: Employee Details
    designation: '',
    department: '',
    salary: '',
    workHours: '',
    holidays: '',
    bonus: '',
    
    // Step 5: Additional
    profileImage: '',
    eSignature: '',
    responsibilities: '',
  });
  
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch roles
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await roleApi.getAll();
      return response.data.data || [];
    },
    enabled: isOpen,
  });

  // Fetch companies (for SuperAdmin only)
  const { data: companiesResponse } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await companyApi.getAll();
      return response.data.data || [];
    },
    enabled: isSuperAdmin && isOpen,
  });

  const roles = rolesResponse || [];
  const companies = companiesResponse || [];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    if (step === 3 && isSuperAdmin) {
      if (!formData.roleId || formData.roleId === 0) newErrors.roleId = 'Role is required';
      if (!formData.companyId || formData.companyId === 0) newErrors.companyId = 'Company is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image to reduce size
        const compressedImage = await compressImage(file, 800, 0.8);
        setProfileImagePreview(compressedImage);
        setFormData({ ...formData, profileImage: compressedImage });
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImagePreview(reader.result as string);
          setFormData({ ...formData, profileImage: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSignatureChange = (signature: string) => {
    setFormData({ ...formData, eSignature: signature });
  };

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create user with all data in one call
      // For non-SuperAdmin, set default roleId to Employee role (usually 2, but we'll use the first non-Client role)
      let finalRoleId = data.roleId;
      let finalCompanyId = data.companyId;
      
      if (!isSuperAdmin) {
        // For non-SuperAdmin, use current user's company and find Employee role
        finalCompanyId = currentUser?.companyId || 0;
        // Find Employee role (skip Client role)
        const employeeRole = roles.find((r: any) => r.name !== 'Client' && r.name !== 'SuperAdmin');
        finalRoleId = employeeRole?.id || 2; // Default to role ID 2 if not found
      }

      const userData: any = {
        email: data.email,
        password: data.password,
        name: data.name || null,
        phone: data.phone || null,
        address: data.address || null,
        education: data.education || null,
        roleId: finalRoleId,
        companyId: finalCompanyId,
        profileImage: data.profileImage || null,
        eSignature: data.eSignature || null,
      };

      const userResponse = await userApi.create(userData);
      const userId = userResponse.data.data.id;

      // Then update user with employee fields (which will create employee record)
      const employeeData: any = {
        designation: data.designation || null,
        department: data.department || null,
        salary: data.salary ? parseFloat(data.salary) : null,
        workHours: data.workHours ? parseFloat(data.workHours) : null,
        holidays: data.holidays ? parseInt(data.holidays) : null,
        bonus: data.bonus ? parseFloat(data.bonus) : null,
        responsibilities: data.responsibilities || null,
      };

      await userApi.update(userId, employeeData);
      
      return { userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      handleClose();
      alert('Employee created successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create employee');
    },
  });

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      createEmployeeMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      address: '',
      education: '',
      roleId: 0,
      companyId: currentUser?.companyId || 0,
      designation: '',
      department: '',
      salary: '',
      workHours: '',
      holidays: '',
      bonus: '',
      profileImage: '',
      eSignature: '',
      responsibilities: '',
    });
    setProfileImagePreview(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter full name"
                />
              </div>
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter password (min 6 characters)"
                />
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm password"
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="education">Education</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  rows={4}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter education details"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {isSuperAdmin ? (
              <>
                <div>
                  <Label htmlFor="roleId">Role *</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      id="roleId"
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white ${errors.roleId ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value={0}>Select a role</option>
                      {roles.filter((role: any) => role.name !== 'Client').map((role: any) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.roleId && <p className="text-sm text-red-500 mt-1">{errors.roleId}</p>}
                </div>

                <div>
                  <Label htmlFor="companyId">Company *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      id="companyId"
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: parseInt(e.target.value) })}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white ${errors.companyId ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value={0}>Select a company</option>
                      {companies.map((company: any) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.companyId && <p className="text-sm text-red-500 mt-1">{errors.companyId}</p>}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Employee will be assigned to your current company with default employee role.</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="designation">Designation</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="pl-10"
                  placeholder="e.g., Senior Developer, Marketing Manager"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="pl-10"
                  placeholder="e.g., Engineering, Marketing, Sales"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary">Salary</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="pl-10"
                    placeholder="Annual salary"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="workHours">Work Hours (per week)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="workHours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="168"
                    value={formData.workHours}
                    onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
                    className="pl-10"
                    placeholder="e.g., 40"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="holidays">Holidays (per year)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="holidays"
                    type="number"
                    min="0"
                    value={formData.holidays}
                    onChange={(e) => setFormData({ ...formData, holidays: e.target.value })}
                    className="pl-10"
                    placeholder="e.g., 20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bonus">Bonus</Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="bonus"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    className="pl-10"
                    placeholder="Bonus amount"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
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
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-400" />
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
                    Upload a profile image (JPG, PNG, etc.)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label>E-Signature</Label>
              <div className="mt-2 border border-gray-300 rounded-lg p-4 bg-slate-50">
                <SignaturePad onSignatureChange={handleSignatureChange} />
              </div>
            </div>

            <div>
              <CodeEditor
                value={formData.responsibilities}
                onChange={(value) => setFormData({ ...formData, responsibilities: value })}
                placeholder="Describe the employee's responsibilities, duties, and what they will do in the company..."
                language="markdown"
                rows={10}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Add New Employee</CardTitle>
              <CardDescription className="mt-1">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs mt-2 text-center ${isActive ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 mt-[-20px] ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </CardContent>

        <div className="border-t border-gray-200 p-4 bg-slate-50 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || createEmployeeMutation.isPending}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={createEmployeeMutation.isPending}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createEmployeeMutation.isPending}
            >
              {createEmployeeMutation.isPending ? (
                'Creating...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Employee
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

