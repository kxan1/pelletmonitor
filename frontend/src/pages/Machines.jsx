import { useState } from 'react'
import { useDevice } from '../context/DeviceContext'
import { createMachine, updateMachine, deleteMachine } from '../api/client'

const EMPTY_FORM = { device_id: '', machine_name: '', machine_model: '', owner: '' }

export default function Machines() {
  const { machines, refreshMachines, setSelectedDeviceId } = useDevice()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [error, setError] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    try {
      await createMachine(form)
      setForm(EMPTY_FORM)
      await refreshMachines()
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add machine')
    }
  }

  function startEdit(m) {
    setEditingId(m.device_id)
    setEditDraft({ machine_name: m.machine_name, machine_model: m.machine_model || '', owner: m.owner || '' })
  }

  async function saveEdit(deviceId) {
    try {
      await updateMachine(deviceId, { device_id: deviceId, ...editDraft })
      setEditingId(null)
      await refreshMachines()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update')
    }
  }

  async function handleDelete(deviceId) {
    if (!window.confirm(`Remove "${deviceId}"? Its logged readings will remain in the database but won't show machine info.`)) return
    try {
      await deleteMachine(deviceId)
      await refreshMachines()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete')
    }
  }

  return (
    <div className="app-shell">
      <h1 className="page-title">Machines</h1>
      <p className="subtitle" style={{ marginBottom: 20 }}>
        Register each physical pellet machine here. The <code>device_id</code> must exactly match
        the <code>DEVICE_ID</code> value that machine's Blynk bridge instance is configured with —
        that's how readings get linked to the right machine.
      </p>
      {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{error}</p>}

      <div className="chart-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add a machine</h3>
        <form onSubmit={handleAdd} className="machine-form">
          <div>
            <label className="form-label">Device ID</label>
            <input className="form-input" placeholder="e.g. esp32-feeder-02" value={form.device_id}
              onChange={(e) => setForm({ ...form, device_id: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Machine Name</label>
            <input className="form-input" placeholder="e.g. Coop B Feeder" value={form.machine_name}
              onChange={(e) => setForm({ ...form, machine_name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Model</label>
            <input className="form-input" value={form.machine_model}
              onChange={(e) => setForm({ ...form, machine_model: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Owner</label>
            <input className="form-input" value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          </div>
          <button className="primary-btn" type="submit">Add Machine</button>
        </form>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Device ID</th><th>Name</th><th>Model</th><th>Owner</th><th></th></tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr key={m.device_id}>
                <td>{m.device_id}</td>
                {editingId === m.device_id ? (
                  <>
                    <td><input className="cell-input" value={editDraft.machine_name} onChange={(e) => setEditDraft({ ...editDraft, machine_name: e.target.value })} /></td>
                    <td><input className="cell-input" value={editDraft.machine_model} onChange={(e) => setEditDraft({ ...editDraft, machine_model: e.target.value })} /></td>
                    <td><input className="cell-input" value={editDraft.owner} onChange={(e) => setEditDraft({ ...editDraft, owner: e.target.value })} /></td>
                  </>
                ) : (
                  <>
                    <td>{m.machine_name}</td>
                    <td>{m.machine_model || '—'}</td>
                    <td>{m.owner || '—'}</td>
                  </>
                )}
                <td className="table-actions">
                  {editingId === m.device_id ? (
                    <>
                      <button className="export-btn" onClick={() => saveEdit(m.device_id)}>Save</button>
                      <button className="export-btn" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="export-btn" onClick={() => setSelectedDeviceId(m.device_id)}>View</button>
                      <button className="export-btn" onClick={() => startEdit(m)}>Edit</button>
                      <button className="export-btn danger" onClick={() => handleDelete(m.device_id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {machines.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--ink-dim)', textAlign: 'center', padding: 24 }}>No machines registered yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
