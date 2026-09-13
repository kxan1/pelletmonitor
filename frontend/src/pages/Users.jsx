import { useEffect, useState, useCallback } from 'react'
import { fetchPendingUsers, fetchAllUsers, approveUser, removeUser, updateUserRole, resolveImageUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'

function Avatar({ user }) {
  if (user.avatar_url) {
    return <img src={resolveImageUrl(user.avatar_url)} alt="" className="users-avatar" />
  }
  const initial = (user.full_name || user.email || '?')[0].toUpperCase()
  return <span className="users-avatar-placeholder">{initial}</span>
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const [pending, setPending] = useState([])
  const [all, setAll] = useState([])
  const [pendingRoles, setPendingRoles] = useState({})
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([fetchPendingUsers(), fetchAllUsers()])
      setPending(p)
      setAll(a)
      setPendingRoles(Object.fromEntries(p.map((u) => [u.id, u.role])))
      setError(null)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load users.')
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleApprove(u) {
    try {
      const chosenRole = pendingRoles[u.id] || u.role
      if (chosenRole !== u.role) {
        await updateUserRole(u.id, chosenRole)
      }
      await approveUser(u.id)
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to approve')
    }
  }

  async function handleReject(id) {
    if (!window.confirm('Remove this account?')) return
    try {
      await removeUser(id)
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to remove')
    }
  }

  async function handleRoleChange(userId, role) {
    try {
      await updateUserRole(userId, role)
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to change role')
    }
  }

  return (
    <div className="app-shell">
      <h1 className="page-title">User Management</h1>
      {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{error}</p>}

      <div className="chart-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Pending Approval ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="subtitle">No pending registrations.</p>
        ) : (
          <div className="table-wrap" style={{ marginBottom: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th></th><th>Name</th><th>Email</th><th>Organization</th><th>Role</th><th>Submitted</th><th></th></tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u.id}>
                    <td><Avatar user={u} /></td>
                    <td>{u.full_name || '—'}</td>
                    <td>{u.email}</td>
                    <td>{u.organization || '—'}</td>
                    <td>
                      <select
                        className="param-select"
                        value={pendingRoles[u.id] || u.role}
                        onChange={(e) => setPendingRoles({ ...pendingRoles, [u.id]: e.target.value })}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(u.created_at).toLocaleString()}</td>
                    <td className="table-actions">
                      <button className="export-btn" onClick={() => handleApprove(u)}>Approve</button>
                      <button className="export-btn danger" onClick={() => handleReject(u.id)}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th></th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Member Since</th><th></th></tr>
          </thead>
          <tbody>
            {all.map((u) => (
              <tr key={u.id}>
                <td><Avatar user={u} /></td>
                <td>{u.full_name || '—'}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="param-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.email === currentUser?.email}
                    title={u.email === currentUser?.email ? "You can't change your own role" : ''}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{u.is_approved ? 'Approved' : 'Pending'}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="table-actions">
                  {u.email !== currentUser?.email && (
                    <button className="export-btn danger" onClick={() => handleReject(u.id)}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
