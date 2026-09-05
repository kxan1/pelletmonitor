import { useEffect, useState, useCallback } from 'react'
import {
  fetchReadingsTable, updateReading, deleteReading,
  fetchMachines, createMachine, updateMachine,
} from '../api/client'

const DEVICE_ID = 'esp32-feeder-01'

export default function AdminCrud() {
  const [rows, setRows] = useState([])
  const [machine, setMachine] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [machineDraft, setMachineDraft] = useState({ machine_name: '', machine_model: '', owner: '' })
  const [error, setError] = useState(null)
  const [savingMachine, setSavingMachine] = useState(false)

  const load = useCallback(async () => {
    try {
      const [table, machines] = await Promise.all([fetchReadingsTable(DEVICE_ID), fetchMachines()])
      setRows(table)
      const m = machines.find((x) => x.device_id === DEVICE_ID) || null
      setMachine(m)
      if (m) setMachineDraft({ machine_name: m.machine_name || '', machine_model: m.machine_model || '', owner: m.owner || '' })
      setError(null)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load data. Are you logged in as admin?')
    }
  }, [])

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

  async function saveMachine(e) {
    e.preventDefault()
    setSavingMachine(true)
    try {
      const payload = { device_id: DEVICE_ID, ...machineDraft }
      if (machine) {
        await updateMachine(DEVICE_ID, payload)
      } else {
        await createMachine(payload)
      }
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save machine info')
    } finally {
      setSavingMachine(false)
    }
  }

  return (
    <div className="app-shell">
      <h1 className="page-title">Logged Data — CRUD</h1>
      <p className="subtitle" style={{ marginBottom: 20 }}>
        Edit or delete individual logged readings, and manage the machine identity attached to them.
      </p>
      {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{error}</p>}

      <div className="chart-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Machine Identity</h3>
        <form onSubmit={saveMachine} className="machine-form">
          <div>
            <label className="form-label">Machine Name</label>
            <input
              className="form-input"
              value={machineDraft.machine_name}
              onChange={(e) => setMachineDraft({ ...machineDraft, machine_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label">Machine Model</label>
            <input
              className="form-input"
              value={machineDraft.machine_model}
              onChange={(e) => setMachineDraft({ ...machineDraft, machine_model: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Owner</label>
            <input
              className="form-input"
              value={machineDraft.owner}
              onChange={(e) => setMachineDraft({ ...machineDraft, owner: e.target.value })}
            />
          </div>
          <button className="primary-btn" type="submit" disabled={savingMachine}>
            {savingMachine ? 'Saving…' : 'Save Machine Info'}
          </button>
        </form>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date Recorded</th>
              <th>Voltage (V)</th>
              <th>Current (A)</th>
              <th>Power (W)</th>
              <th>Battery (%)</th>
              <th>Machine</th>
              <th>Model</th>
              <th>Owner</th>
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
                <td>{r.machine_name || '—'}</td>
                <td>{r.machine_model || '—'}</td>
                <td>{r.owner || '—'}</td>
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
              <tr><td colSpan={9} style={{ color: 'var(--ink-dim)', textAlign: 'center', padding: 24 }}>No readings logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
