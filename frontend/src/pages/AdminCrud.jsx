import { useEffect, useState, useCallback, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot, ResponsiveContainer } from 'recharts'
import { useDevice } from '../context/DeviceContext'
import { fetchReadingsTable, updateReading, deleteReading, fetchReadingContext } from '../api/client'

const PARAM_OPTIONS = [
  { key: 'voltage', label: 'Voltage', unit: 'V' },
  { key: 'current', label: 'Current', unit: 'A' },
  { key: 'power', label: 'Power', unit: 'W' },
]

export default function AdminCrud() {
  const { selectedDeviceId, machines } = useDevice()
  const [rows, setRows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [viewingId, setViewingId] = useState(null)
  const [contextData, setContextData] = useState([])
  const [contextParam, setContextParam] = useState('voltage')
  const [contextLoading, setContextLoading] = useState(false)
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

  async function toggleView(id) {
    if (viewingId === id) {
      setViewingId(null)
      return
    }
    setViewingId(id)
    setContextLoading(true)
    try {
      const data = await fetchReadingContext(id, 30)
      setContextData(data)
    } catch (e) {
      setContextData([])
    } finally {
      setContextLoading(false)
    }
  }

  function startEdit(row) {
    setEditingId(row.id)
    setViewingId(null)
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

  const viewingRow = rows.find((r) => r.id === viewingId)
  const paramMeta = PARAM_OPTIONS.find((p) => p.key === contextParam)

  return (
    <div className="app-shell">
      <h1 className="page-title">Logged Data — CRUD</h1>
      <p className="subtitle" style={{ marginBottom: 20 }}>
        Viewing: <strong>{currentMachine?.machine_name || selectedDeviceId}</strong>
        {' '}— switch machines using the selector in the nav bar. Manage machine identity
        on the <Link to="/admin/machines">Machines</Link> page.
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
              <Fragment key={r.id}>
                <tr>
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
                        <button className="export-btn" onClick={() => toggleView(r.id)}>{viewingId === r.id ? 'Close' : 'View'}</button>
                        <button className="export-btn" onClick={() => startEdit(r)}>Edit</button>
                        <button className="export-btn danger" onClick={() => handleDelete(r.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
                {viewingId === r.id && (
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div className="reading-view-panel">
                        <div className="reading-view-header">
                          <span>Showing {contextParam} in a ±15 min window around this record</span>
                          <select className="param-select" value={contextParam} onChange={(e) => setContextParam(e.target.value)}>
                            {PARAM_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                          </select>
                        </div>
                        {contextLoading ? (
                          <p className="subtitle" style={{ padding: 12 }}>Loading…</p>
                        ) : contextData.length === 0 ? (
                          <p className="subtitle" style={{ padding: 12 }}>No nearby readings found.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={contextData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                              <CartesianGrid stroke="var(--border)" vertical={false} />
                              <XAxis
                                dataKey="recorded_at"
                                tickFormatter={(iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-dim)' }}
                                minTickGap={30}
                              />
                              <YAxis
                                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-dim)' }}
                                width={40}
                                label={{ value: paramMeta.unit, angle: -90, position: 'insideLeft', fill: 'var(--ink-dim)', fontSize: 10 }}
                              />
                              <Tooltip
                                labelFormatter={(iso) => new Date(iso).toLocaleString()}
                                contentStyle={{ background: 'var(--panel-raised)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                              />
                              <Line type="monotone" dataKey={contextParam} stroke="var(--amber)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
                              {viewingRow && (
                                <ReferenceDot
                                  x={viewingRow.recorded_at}
                                  y={viewingRow[contextParam]}
                                  r={6}
                                  fill="var(--red)"
                                  stroke="var(--bg)"
                                  strokeWidth={2}
                                  isFront
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
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
