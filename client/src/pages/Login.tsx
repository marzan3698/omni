import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthBanner } from '@/components/ui/AuthBanner';
import { SocialLoginButtons } from '@/components/ui/SocialLoginButtons';
import { headerApi, colorApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch header settings (for logo and branding)
  const { data: headerSettings } = useQuery({
    queryKey: ['header-settings-login'],
    queryFn: async () => {
      try {
        const response = await headerApi.getHeaderSettings();
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch color settings
  const { data: colorSettings } = useQuery({
    queryKey: ['color-settings-login'],
    queryFn: async () => {
      try {
        const response = await colorApi.getColorSettings();
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Use fetched colors or defaults
  const primaryColor = colorSettings?.primaryColor || '#4f46e5';
  const secondaryColor = colorSettings?.secondaryColor || '#7c3aed';
  const logoUrl = headerSettings?.logo ? getImageUrl(headerSettings.logo) : null;
  const logoType = headerSettings?.logoType || 'wide';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Form Container */}
        <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in duration-500">
          {/* Logo and Header */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              {logoUrl ? (
                logoType === 'wide' ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-12 object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-12 w-12 object-contain"
                    />
                    <span className="text-2xl font-bold text-slate-900">Omni</span>
                  </div>
                )
              ) : (
                <>
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    <span className="text-white font-bold text-xl">O</span>
                  </div>
                  <h1
                    className="text-3xl font-bold bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    Omni
                  </h1>
                </>
              )}
            </div>
            <p className="text-slate-600 text-sm">Enterprise Management System</p>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-600 text-sm">
              Sign in to your account to continue managing your business
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-in slide-in-from-top duration-300 flex items-start gap-3">
              <div className="flex-1">{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-900 block">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:transition-colors duration-200" style={{ color: '#9ca3af' }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-12 h-11 border-slate-200 rounded-lg transition-all duration-200"
                  style={{
                    '--tw-ring-color': primaryColor,
                  } as any}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1 animate-in fade-in duration-200">
                  <span>•</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-900">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-medium transition-colors duration-200 hover:underline"
                  style={{ color: primaryColor }}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:transition-colors duration-200" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-11 border-slate-200 rounded-lg transition-all duration-200"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1 animate-in fade-in duration-200">
                  <span>•</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Social Login */}
          <SocialLoginButtons isLoading={isLoading} />

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-slate-600 text-sm">
              Don't have an account?{' '}
              <a
                href="/register"
                className="font-semibold transition-colors duration-200 hover:underline"
                style={{ color: primaryColor }}
              >
                Create one
              </a>
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 border-t border-slate-200 pt-6">
            <a href="#" className="hover:text-slate-700 transition-colors">
              Privacy
            </a>
            <span>•</span>
            <a href="#" className="hover:text-slate-700 transition-colors">
              Terms
            </a>
            <span>•</span>
            <a href="#" className="hover:text-slate-700 transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>

      {/* Right Panel - Banner Section */}
      <AuthBanner
        variant="login"
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        logoUrl={logoUrl}
        logoType={logoType}
      />
    </div>
  );
}

