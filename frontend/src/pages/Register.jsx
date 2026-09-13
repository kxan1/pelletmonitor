import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerRequest } from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', full_name: '', organization: '', requested_role: 'user',
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await registerRequest({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        organization: form.organization || null,
        requested_role: form.requested_role,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="app-shell narrow">
        <div className="form-panel">
          <h2>Registration Submitted</h2>
          <p className="subtitle" style={{ marginTop: 12 }}>
            Thanks, {form.full_name}. An admin needs to approve your account before you can log in.
            You'll be able to sign in once that happens.
          </p>
          <button className="primary-btn" onClick={() => navigate('/login')}>Back to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell narrow">
      <div className="form-panel">
        <h2>Create an Account</h2>
        <p className="subtitle" style={{ marginBottom: 20 }}>
          Registration requires admin approval before you can sign in.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />

          <label className="form-label">Organization (optional)</label>
          <input className="form-input" value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })} />

          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />

          <label className="form-label">Password (min 8 characters)</label>
          <input className="form-input" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />

          <label className="form-label">Confirm Password</label>
          <input className="form-input" type="password" value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />

          <label className="form-label">Account Type Requested</label>
          <select className="form-input" value={form.requested_role}
            onChange={(e) => setForm({ ...form, requested_role: e.target.value })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Register'}
          </button>
        </form>
        <p className="subtitle" style={{ marginTop: 16, fontSize: '0.85rem' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
