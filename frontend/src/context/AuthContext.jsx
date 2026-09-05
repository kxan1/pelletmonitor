import { createContext, useContext, useState, useCallback } from 'react'
import { loginRequest } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('feeder_token'))
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('feeder_user')
    return raw ? JSON.parse(raw) : null
  })

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password)
    localStorage.setItem('feeder_token', data.access_token)
    localStorage.setItem('feeder_user', JSON.stringify({ email: data.email, role: data.role }))
    setToken(data.access_token)
    setUser({ email: data.email, role: data.role })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('feeder_token')
    localStorage.removeItem('feeder_user')
    setToken(null)
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ token, user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
