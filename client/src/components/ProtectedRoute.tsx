import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from '@/pages/Login';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, isClient, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Redirect clients trying to access admin routes
  if (isClient && !window.location.pathname.startsWith('/client/')) {
    return <Navigate to="/client/dashboard" replace />;
  }

  // Redirect non-clients trying to access client routes
  if (!isClient && window.location.pathname.startsWith('/client/')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

