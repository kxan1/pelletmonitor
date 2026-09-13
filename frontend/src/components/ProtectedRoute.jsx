import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = true }) {
  const { user, isAdmin } = useAuth()
  const allowed = adminOnly ? isAdmin : !!user
  if (!allowed) {
    return <Navigate to="/login" replace />
  }
  return children
}
