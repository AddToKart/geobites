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
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-soft)]">
        Loading session...
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
