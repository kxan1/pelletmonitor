import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginRequest, setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem('feeder_token'))
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('feeder_user')
    return raw ? JSON.parse(raw) : null
  })
  const [sessionExpiredAt, setSessionExpiredAt] = useState(null)

  const logout = useCallback(() => {
    localStorage.removeItem('feeder_token')
    localStorage.removeItem('feeder_user')
    setToken(null)
    setUser(null)
  }, [])

  // Registered once — fires whenever any authenticated API call gets a 401,
  // e.g. an expired/invalid token. Clears the stale session and bounces to
  // login with a clear reason, instead of leaving the user stuck.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      setSessionExpiredAt(new Date())
      navigate('/login')
    })
  }, [logout, navigate])

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password)
    localStorage.setItem('feeder_token', data.access_token)
    localStorage.setItem('feeder_user', JSON.stringify({ email: data.email, role: data.role }))
    setToken(data.access_token)
    setUser({ email: data.email, role: data.role })
    setSessionExpiredAt(null)
    return data
  }, [])

  const clearSessionExpired = useCallback(() => setSessionExpiredAt(null), [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ token, user, isAdmin, login, logout, sessionExpiredAt, clearSessionExpired }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
