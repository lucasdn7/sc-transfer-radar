
import { useTechnicalAuth } from '@/hooks/useTechnicalAuth';

interface TechnicalAuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TechnicalAuthGuard({ children, fallback }: TechnicalAuthGuardProps) {
  const { isAuthenticated, loading } = useTechnicalAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
