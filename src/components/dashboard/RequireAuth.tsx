import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/ui/Logo';

export function RequireAuth() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05060a]">
        <div className="flex flex-col items-center gap-4">
          <LogoMark className="animate-pulse" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6c7085]">
            Opening workspace
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
