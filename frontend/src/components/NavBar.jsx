import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function NavBar() {
  const { user, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          FEEDER MONITOR
        </NavLink>

        <button className="nav-hamburger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}>Dashboard</NavLink>
          {isAdmin && (
            <NavLink to="/admin/readings" className={linkClass} onClick={() => setOpen(false)}>Data (CRUD)</NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/keys" className={linkClass} onClick={() => setOpen(false)}>Manage Keys</NavLink>
          )}
          <NavLink to="/docs" className={linkClass} onClick={() => setOpen(false)}>Documentation</NavLink>
          <NavLink to="/faq" className={linkClass} onClick={() => setOpen(false)}>FAQ</NavLink>
          <NavLink to="/about" className={linkClass} onClick={() => setOpen(false)}>About</NavLink>
          <NavLink to="/settings" className={linkClass} onClick={() => setOpen(false)}>Settings</NavLink>

          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          {user ? (
            <button className="export-btn" onClick={handleLogout}>Log out ({user.email})</button>
          ) : (
            <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>Admin Login</NavLink>
          )}
        </div>
      </div>
    </nav>
  )
}
