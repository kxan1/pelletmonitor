import { useEffect, useState, useCallback } from 'react'
import { fetchMetrics, createMetric, updateMetric, deleteMetric } from '../api/client'

const EMPTY_FORM = { key: '', label: '', unit: '', vpin: '', exclude_from_stats: false }

export default function ManageKeys() {
  const [metrics, setMetrics] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingKey, setEditingKey] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setMetrics(await fetchMetrics())
      setError(null)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load metrics. Are you logged in as admin?')
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd(e) {
    e.preventDefault()
    try {
      await createMetric(form)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add key')
    }
  }

  function startEditVpin(m) {
    setEditingKey(m.key)
    setForm({ key: m.key, label: m.label, unit: m.unit, vpin: m.vpin, exclude_from_stats: m.exclude_from_stats })
  }

  async function saveVpin(key) {
    try {
      await updateMetric(key, form)
      setEditingKey(null)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update')
    }
  }

  async function handleDelete(key) {
    if (!window.confirm(`Remove the "${key}" parameter? This does not delete already-logged data.`)) return
    try {
      await deleteMetric(key)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete (core parameters cannot be removed)')
    }
  }

  return (
    <div className="app-shell">
      <h1 className="page-title">Manage Keys</h1>
      <p className="subtitle" style={{ marginBottom: 20 }}>
        Add a new sensor parameter here (with its Blynk vPin) and it will automatically appear as a
        readout card and chart option on the dashboard — no code changes needed. You can also
        reassign which vPin feeds an existing parameter.
      </p>
      {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{error}</p>}

      <div className="chart-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add a new key</h3>
        <form onSubmit={handleAdd} className="machine-form">
          <div>
            <label className="form-label">Key (internal id)</label>
            <input className="form-input" placeholder="e.g. temperature" value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Label (shown in UI)</label>
            <input className="form-input" placeholder="e.g. Temperature" value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Unit</label>
            <input className="form-input" placeholder="e.g. °C" value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Blynk vPin</label>
            <input className="form-input" placeholder="e.g. V4" value={form.vpin}
              onChange={(e) => setForm({ ...form, vpin: e.target.value })} required />
          </div>
          <button className="primary-btn" type="submit">Add Key</button>
        </form>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Key</th><th>Label</th><th>Unit</th><th>vPin</th><th>Type</th><th></th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.key}>
                <td>{m.key}</td>
                <td>{m.label}</td>
                <td>{m.unit || '—'}</td>
                <td>
                  {editingKey === m.key ? (
                    <input className="cell-input" value={form.vpin} onChange={(e) => setForm({ ...form, vpin: e.target.value })} />
                  ) : m.vpin}
                </td>
                <td>{m.is_core ? 'Core' : 'Custom'}</td>
                <td className="table-actions">
                  {editingKey === m.key ? (
                    <>
                      <button className="export-btn" onClick={() => saveVpin(m.key)}>Save</button>
                      <button className="export-btn" onClick={() => { setEditingKey(null); setForm(EMPTY_FORM) }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="export-btn" onClick={() => startEditVpin(m)}>Edit vPin</button>
                      {!m.is_core && <button className="export-btn danger" onClick={() => handleDelete(m.key)}>Delete</button>}
                    </>
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
