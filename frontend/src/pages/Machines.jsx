import { useState, Fragment } from 'react'
import { useDevice } from '../context/DeviceContext'
import { useAuth } from '../context/AuthContext'
import { createMachine, updateMachine, deleteMachine, resolveImageUrl } from '../api/client'
import ImageUploader from '../components/ImageUploader'

const EMPTY_FORM = {
  device_id: '', machine_name: '', machine_model: '', owner: '',
  manufacturer: '', company: '', date_bought: '', description: '', image_url: '',
}

export default function Machines() {
  const { machines, refreshMachines, setSelectedDeviceId } = useDevice()
  const { isAdmin } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [error, setError] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    try {
      const payload = { ...form, date_bought: form.date_bought || null }
      await createMachine(payload)
      setForm(EMPTY_FORM)
      await refreshMachines()
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add machine')
    }
  }

  function startEdit(m) {
    setEditingId(m.device_id)
    setViewingId(null)
    setEditDraft({
      machine_name: m.machine_name,
      machine_model: m.machine_model || '',
      owner: m.owner || '',
      manufacturer: m.manufacturer || '',
      company: m.company || '',
      date_bought: m.date_bought ? m.date_bought.slice(0, 10) : '',
      description: m.description || '',
      image_url: m.image_url || '',
    })
  }

  async function saveEdit(deviceId) {
    try {
      const payload = { device_id: deviceId, ...editDraft, date_bought: editDraft.date_bought || null }
      await updateMachine(deviceId, payload)
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

  const viewingMachine = machines.find((m) => m.device_id === viewingId)

  return (
    <div className="app-shell">
      <h1 className="page-title">Machines</h1>
      <p className="subtitle" style={{ marginBottom: 20 }}>
        Register each physical pellet machine here. The <code>device_id</code> must exactly match
        the <code>DEVICE_ID</code> value that machine's Blynk bridge instance is configured with.
      </p>
      {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{error}</p>}

      {isAdmin && (
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
          <div>
            <label className="form-label">Manufacturer</label>
            <input className="form-input" value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Company</label>
            <input className="form-input" value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Date Bought</label>
            <input className="form-input" type="date" value={form.date_bought}
              onChange={(e) => setForm({ ...form, date_bought: e.target.value })} />
          </div>
          <div>
            <ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Photo" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="Brief description of this machine" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="primary-btn" type="submit">Add Machine</button>
        </form>
      </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Device ID</th><th>Name</th><th>Model</th><th>Owner</th><th></th></tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <Fragment key={m.device_id}>
                <tr>
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
                        <button className="export-btn" onClick={() => setViewingId(viewingId === m.device_id ? null : m.device_id)}>
                          {viewingId === m.device_id ? 'Close' : 'View'}
                        </button>
                        <button className="export-btn" onClick={() => setSelectedDeviceId(m.device_id)}>Select</button>
                        {isAdmin && <button className="export-btn" onClick={() => startEdit(m)}>Edit</button>}
                        {isAdmin && <button className="export-btn danger" onClick={() => handleDelete(m.device_id)}>Delete</button>}
                      </>
                    )}
                  </td>
                </tr>
                {editingId === m.device_id && (
                  <tr>
                    <td colSpan={5} style={{ padding: 12, background: 'var(--panel-raised)' }}>
                      <ImageUploader
                        value={editDraft.image_url}
                        onChange={(url) => setEditDraft({ ...editDraft, image_url: url })}
                        label="Photo"
                      />
                    </td>
                  </tr>
                )}
                {viewingId === m.device_id && (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div className="machine-view-panel">
                        {m.image_url ? (
                          <img src={resolveImageUrl(m.image_url)} alt={m.machine_name} className="machine-view-image" />
                        ) : (
                          <div className="machine-view-image machine-view-image-placeholder">No image</div>
                        )}
                        <div className="machine-view-details">
                          <div><span className="mv-label">Manufacturer:</span> {m.manufacturer || '—'}</div>
                          <div><span className="mv-label">Company:</span> {m.company || '—'}</div>
                          <div><span className="mv-label">Date Bought:</span> {m.date_bought ? new Date(m.date_bought).toLocaleDateString() : '—'}</div>
                          <div><span className="mv-label">Owner:</span> {m.owner || '—'}</div>
                          <div className="mv-description">{m.description || 'No description provided.'}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
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
