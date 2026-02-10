import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import { authApi } from '@/lib/auth';
import { workSessionApi } from '@/lib/workSession';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string, companyId: number) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      if (authApi.isAuthenticated()) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
        } catch (error) {
          // Token is invalid, clear it
          authApi.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
    // Redirect based on role
    if (response.user.roleName === 'Client') {
      window.location.href = '/client/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const register = async (email: string, password: string, confirmPassword: string, companyId: number) => {
    const response = await authApi.register({ email, password, confirmPassword, companyId });
    setUser(response.user);
  };

  const logout = () => {
    (async () => {
      try {
        const session = await workSessionApi.getCurrentSession();
        if (session?.isOnline) {
          await workSessionApi.toggleLiveStatus();
        }
      } catch {
        // ignore errors on logout
      }
      sessionStorage.removeItem('activation_shown');
      authApi.logout();
      setUser(null);
      window.location.href = '/login';
    })();
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) {
      return false;
    }
    // SuperAdmin has access to everything
    if (user.roleName === 'SuperAdmin') {
      return true;
    }
    // Check specific permission
    if (!user.permissions) {
      return false;
    }
    return user.permissions[permission] === true;
  };

  const isClient = user?.roleName === 'Client';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        hasPermission,
        isClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

