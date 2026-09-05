import { useEffect, useState, useCallback } from 'react'
import StatusBadge from '../components/StatusBadge'
import ReadoutPanel from '../components/ReadoutPanel'
import TimeRangeTabs from '../components/TimeRangeTabs'
import TimeSeriesChart from '../components/TimeSeriesChart'
import StatsSummary from '../components/StatsSummary'
import { fetchLatest, fetchReadings, fetchStats, fetchStatus, fetchMetrics, exportCsvUrl } from '../api/client'

const DEVICE_ID = 'esp32-feeder-01'
const LIVE_POLL_MS = 4000
const CORE_KEYS = new Set(['voltage', 'current', 'power', 'battery_pct'])

function readingValueFor(reading, key) {
  if (!reading) return null
  if (CORE_KEYS.has(key)) return reading[key]
  return reading.custom_metrics ? reading.custom_metrics[key] : null
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState([])
  const [latest, setLatest] = useState(null)
  const [status, setStatus] = useState({ online: false, last_seen: null })
  const [range, setRange] = useState('1h')
  const [parameter, setParameter] = useState('voltage')
  const [series, setSeries] = useState([])
  const [stats, setStats] = useState([])
  const [error, setError] = useState(null)

  const loadMetrics = useCallback(async () => {
    try {
      const m = await fetchMetrics()
      setMetrics(m)
    } catch (e) {
      // non-fatal: dashboard still works with core-only fallback if this fails
    }
  }, [])

  const loadLive = useCallback(async () => {
    try {
      const [latestData, statusData] = await Promise.all([fetchLatest(DEVICE_ID), fetchStatus(DEVICE_ID)])
      setLatest(latestData)
      setStatus(statusData)
      setError(null)
    } catch (e) {
      setError('Could not reach the backend API. Is uvicorn running?')
    }
  }, [])

  const loadChart = useCallback(async () => {
    try {
      const [seriesData, statsData] = await Promise.all([fetchReadings(range, DEVICE_ID), fetchStats(range, DEVICE_ID)])
      setSeries(seriesData)
      setStats(statsData)
    } catch (e) {
      setError('Could not reach the backend API. Is uvicorn running?')
    }
  }, [range])

  useEffect(() => { loadMetrics() }, [loadMetrics])

  useEffect(() => {
    loadLive()
    const id = setInterval(loadLive, LIVE_POLL_MS)
    return () => clearInterval(id)
  }, [loadLive])

  useEffect(() => {
    loadChart()
    if (range === 'live') {
      const id = setInterval(loadChart, LIVE_POLL_MS)
      return () => clearInterval(id)
    }
  }, [loadChart, range])

  const displayMetrics = metrics.length > 0
    ? metrics
    : [
        { key: 'voltage', label: 'Voltage', unit: 'V' },
        { key: 'current', label: 'Current', unit: 'A' },
        { key: 'power', label: 'Power', unit: 'W' },
        { key: 'battery_pct', label: 'Battery', unit: '%' },
      ]

  return (
    <div className="app-shell">
      <div className="status-strip">
        <div>
          <h1>Chicken Feeder Monitor</h1>
          <p className="subtitle">Electrical parameters — automated pellet dispenser</p>
        </div>
        <StatusBadge online={status.online} lastSeen={status.last_seen} />
      </div>

      {error && (
        <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="readout-grid" style={{ gridTemplateColumns: `repeat(${Math.min(displayMetrics.length, 4)}, 1fr)` }}>
        {displayMetrics.map((m) => (
          <ReadoutPanel
            key={m.key}
            label={m.label.toUpperCase()}
            value={readingValueFor(latest, m.key)}
            unit={m.unit}
            isBattery={m.key === 'battery_pct'}
          />
        ))}
      </div>

      <div className="chart-panel">
        <div className="chart-panel-header">
          <TimeRangeTabs value={range} onChange={setRange} />
          <div className="toolbar-right">
            <select className="param-select" value={parameter} onChange={(e) => setParameter(e.target.value)}>
              {displayMetrics.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
            <button className="export-btn" onClick={() => window.open(exportCsvUrl(range, DEVICE_ID), '_blank')}>
              Export CSV
            </button>
          </div>
        </div>
        <TimeSeriesChart data={series} parameter={parameter} />
      </div>

      <StatsSummary stats={stats} />
    </div>
  )
}
