import { Navigate, Outlet } from 'react-router-dom';
import { UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { AppShell } from './AppShell';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          <span className="text-sm font-medium text-text-soft">Checking session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'seller') {
      return <Navigate to="/seller" replace />;
    }
    if (user.role === 'rider') {
      return <Navigate to="/rider" replace />;
    }
    return <Navigate to="/browse" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
