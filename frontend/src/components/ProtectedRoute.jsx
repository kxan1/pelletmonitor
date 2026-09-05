import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) {
    return <Navigate to="/login" replace />
  }
  return children
}
