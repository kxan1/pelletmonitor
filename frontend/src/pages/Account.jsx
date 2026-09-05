import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { changeCredentials } from '../api/client'

export default function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newEmail && !newPassword) {
      setError('Change at least the email or the password.')
      return
    }
    if (newPassword && newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setSaving(true)
    try {
      const payload = { current_password: currentPassword }
      if (newEmail) payload.new_email = newEmail
      if (newPassword) payload.new_password = newPassword

      const emailChanged = !!newEmail && newEmail !== user.email
      await changeCredentials(payload)

      if (emailChanged) {
        // The JWT is tied to the old email — it's no longer valid for
        // future requests, so force a clean re-login with the new one.
        logout()
        navigate('/login')
        return
      }

      setSuccess('Updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setNewEmail('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update credentials.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell narrow">
      <div className="form-panel">
        <h2>Account</h2>
        <p className="subtitle" style={{ marginBottom: 20 }}>
          Signed in as <strong>{user?.email}</strong>. Change your email and/or password below —
          leave a field blank to keep it unchanged.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="form-label">Current password (required to confirm any change)</label>
          <input
            className="form-input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label className="form-label">New email (optional)</label>
          <input
            className="form-input"
            type="email"
            placeholder={user?.email}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />

          <label className="form-label">New password (optional, min 8 characters)</label>
          <input
            className="form-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          {newPassword && (
            <>
              <label className="form-label">Confirm new password</label>
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </>
          )}

          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
          {success && <p style={{ color: 'var(--green)', fontSize: '0.85rem' }}>{success}</p>}

          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
