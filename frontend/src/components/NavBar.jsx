import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import MachineSelector from './MachineSelector'
import { fetchMe, resolveImageUrl } from '../api/client'

export default function NavBar() {
  const { user, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (user) {
      fetchMe().then(setProfile).catch(() => setProfile(null))
    } else {
      setProfile(null)
    }
  }, [user])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          PELLET MONITOR
        </NavLink>

        <MachineSelector />

        {/* Mobile: toggle + hamburger, always visible without opening the menu */}
        <div className="navbar-always-visible mobile-only-group">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle dark/light theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button className="nav-hamburger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? '✕' : '☰'}
          </button>
        </div>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}>Dashboard</NavLink>
          {user && (
            <NavLink to="/admin/readings" className={linkClass} onClick={() => setOpen(false)}>Data</NavLink>
          )}
          {user && (
            <NavLink to="/admin/machines" className={linkClass} onClick={() => setOpen(false)}>Machines</NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/users" className={linkClass} onClick={() => setOpen(false)}>Users</NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/keys" className={linkClass} onClick={() => setOpen(false)}>Manage Keys</NavLink>
          )}
          <NavLink to="/docs" className={linkClass} onClick={() => setOpen(false)}>Documentation</NavLink>
          <NavLink to="/faq" className={linkClass} onClick={() => setOpen(false)}>FAQ</NavLink>
          <NavLink to="/about" className={linkClass} onClick={() => setOpen(false)}>About</NavLink>
          <NavLink to="/settings" className={linkClass} onClick={() => setOpen(false)}>Settings</NavLink>

          {user ? (
            <>
              <NavLink to="/account" className={({ isActive }) => `nav-link nav-link-account ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
                {profile?.avatar_url ? (
                  <img src={resolveImageUrl(profile.avatar_url)} alt="" className="nav-avatar" />
                ) : (
                  <span className="nav-avatar-placeholder">{(profile?.full_name || user.email)[0].toUpperCase()}</span>
                )}
                Account
              </NavLink>
              <button className="export-btn" onClick={handleLogout}>Log out ({user.email})</button>
            </>
          ) : (
            <>
              <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}>Register</NavLink>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>Admin Login</NavLink>
            </>
          )}

          {/* Desktop: sits naturally at the end of the always-visible link row */}
          <button className="theme-toggle desktop-only-toggle" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle dark/light theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </nav>
  )
}
