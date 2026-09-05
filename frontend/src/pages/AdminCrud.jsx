import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDevice } from '../context/DeviceContext'
import { fetchReadingsTable, updateReading, deleteReading } from '../api/client'

export default function AdminCrud() {
  const { selectedDeviceId, machines } = useDevice()
  const [rows, setRows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [error, setError] = useState(null)

  const currentMachine = machines.find((m) => m.device_id === selectedDeviceId)

  const load = useCallback(async () => {
    if (!selectedDeviceId) return
    try {
      const table = await fetchReadingsTable(selectedDeviceId)
      setRows(table)
      setError(null)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load data. Are you logged in as admin?')
    }
  }, [selectedDeviceId])

  useEffect(() => { load() }, [load])

  function startEdit(row) {
    setEditingId(row.id)
    setEditDraft({ voltage: row.voltage, current: row.current, power: row.power, battery_pct: row.battery_pct })
  }

  async function saveEdit(id) {
    try {
      await updateReading(id, editDraft)
      setEditingId(null)
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Update failed')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this reading permanently?')) return
    try {
      await deleteReading(id)
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Delete failed')
    }
  }

  return (
    <div className="app-shell">
      <h1 className="page-title">Logged Data — CRUD</h1>
      <p className="subtitle" style={{ marginBottom: 20 }}>
        Viewing: <strong>{currentMachine?.machine_name || selectedDeviceId}</strong>
        {' '}— switch machines using the selector in the nav bar. Manage machine identity
        (name/model/owner) on the <Link to="/admin/machines">Machines</Link> page.
      </p>
      {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{error}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date Recorded</th>
              <th>Voltage (V)</th>
              <th>Current (A)</th>
              <th>Power (W)</th>
              <th>Battery (%)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.recorded_at).toLocaleString()}</td>
                {editingId === r.id ? (
                  <>
                    <td><input className="cell-input" type="number" step="0.01" value={editDraft.voltage ?? ''} onChange={(e) => setEditDraft({ ...editDraft, voltage: parseFloat(e.target.value) })} /></td>
                    <td><input className="cell-input" type="number" step="0.01" value={editDraft.current ?? ''} onChange={(e) => setEditDraft({ ...editDraft, current: parseFloat(e.target.value) })} /></td>
                    <td><input className="cell-input" type="number" step="0.01" value={editDraft.power ?? ''} onChange={(e) => setEditDraft({ ...editDraft, power: parseFloat(e.target.value) })} /></td>
                    <td><input className="cell-input" type="number" step="0.01" value={editDraft.battery_pct ?? ''} onChange={(e) => setEditDraft({ ...editDraft, battery_pct: parseFloat(e.target.value) })} /></td>
                  </>
                ) : (
                  <>
                    <td>{r.voltage?.toFixed(2) ?? '—'}</td>
                    <td>{r.current?.toFixed(2) ?? '—'}</td>
                    <td>{r.power?.toFixed(2) ?? '—'}</td>
                    <td>{r.battery_pct?.toFixed(2) ?? '—'}</td>
                  </>
                )}
                <td className="table-actions">
                  {editingId === r.id ? (
                    <>
                      <button className="export-btn" onClick={() => saveEdit(r.id)}>Save</button>
                      <button className="export-btn" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="export-btn" onClick={() => startEdit(r)}>Edit</button>
                      <button className="export-btn danger" onClick={() => handleDelete(r.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ color: 'var(--ink-dim)', textAlign: 'center', padding: 24 }}>No readings logged yet for this machine.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
