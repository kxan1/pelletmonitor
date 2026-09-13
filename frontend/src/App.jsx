import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { DeviceProvider } from './context/DeviceContext'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import AdminCrud from './pages/AdminCrud'
import ManageKeys from './pages/ManageKeys'
import Machines from './pages/Machines'
import Users from './pages/Users'
import Account from './pages/Account'
import About from './pages/About'
import Docs from './pages/Docs'
import FAQ from './pages/FAQ'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DeviceProvider>
          <NavBar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/about" element={<About />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/account" element={<ProtectedRoute adminOnly={false}><Account /></ProtectedRoute>} />
            <Route path="/admin/readings" element={<ProtectedRoute adminOnly={false}><AdminCrud /></ProtectedRoute>} />
            <Route path="/admin/keys" element={<ProtectedRoute><ManageKeys /></ProtectedRoute>} />
            <Route path="/admin/machines" element={<ProtectedRoute adminOnly={false}><Machines /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          </Routes>
        </DeviceProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
