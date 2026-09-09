import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Wraps a route that requires authentication.
 *
 * Behaviour:
 *   • While AuthContext is restoring the session (isLoading=true) → full-screen skeleton
 *   • If authenticated → renders children
 *   • If not authenticated → redirects to /login, preserving the intended
 *     destination in `state.from` so LoginPage can redirect back after sign-in.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center mb-2 animate-pulse">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><circle cx="18" cy="12" r="2"/>
          </svg>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <Skeleton height={14} width="60%" className="mx-auto" />
          <Skeleton height={12} width="40%" className="mx-auto" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
