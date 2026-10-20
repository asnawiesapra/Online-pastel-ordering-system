import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { PageLoader } from '../ui/Feedback'

export function ProtectedRoute({ children, allow = null, redirectTo = '/login' }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Checking your account…" />

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />
  }

  if (allow && !allow.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}
