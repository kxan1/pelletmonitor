import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, sessionExpiredAt, clearSessionExpired } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell narrow">
      <div className="form-panel">
        <h2>Login</h2>
        <p className="subtitle" style={{ marginBottom: 20 }}>
          Sign in to edit logged data, manage parameters, and configure the system.
        </p>

        {sessionExpiredAt && (
          <div style={{
            background: 'var(--panel-raised)', border: '1px solid var(--red)', padding: '10px 14px',
            marginBottom: 18, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--red)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          }}>
            <span>
              Previous session expired at {sessionExpiredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.
              Please sign in again.
            </span>
            <button onClick={clearSessionExpired} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>✕</button>
          </div>
        )}

        <div style={{
          background: 'var(--panel-raised)', border: '1px dashed var(--amber)', padding: '10px 14px',
          marginBottom: 18, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-dim)',
        }}>
          Default admin (first boot / recovery): <strong style={{ color: 'var(--amber)' }}>admin@example.com</strong> / <strong style={{ color: 'var(--amber)' }}>admin</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="subtitle" style={{ marginTop: 16, fontSize: '0.85rem' }}>
          Don't have an account? <Link to="/register">Register here</Link> — new accounts require admin approval.
        </p>
      </div>
    </div>
  )
}
