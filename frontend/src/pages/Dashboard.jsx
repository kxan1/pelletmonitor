import { useEffect, useState, useCallback } from 'react'
import { useDevice } from '../context/DeviceContext'
import StatusBadge from '../components/StatusBadge'
import ReadoutPanel from '../components/ReadoutPanel'
import TimeRangeTabs from '../components/TimeRangeTabs'
import TimeSeriesChart from '../components/TimeSeriesChart'
import StatsSummary from '../components/StatsSummary'
import { fetchLatest, fetchReadings, fetchStats, fetchStatus, fetchMetrics, exportCsvUrl } from '../api/client'

const LIVE_POLL_MS = 4000
const CORE_KEYS = new Set(['voltage', 'current', 'power', 'battery_pct'])

function readingValueFor(reading, key) {
  if (!reading) return null
  if (CORE_KEYS.has(key)) return reading[key]
  return reading.custom_metrics ? reading.custom_metrics[key] : null
}

export default function Dashboard() {
  const { selectedDeviceId, machines } = useDevice()
  const [metrics, setMetrics] = useState([])
  const [latest, setLatest] = useState(null)
  const [status, setStatus] = useState({ online: false, last_seen: null })
  const [range, setRange] = useState('1h')
  const [parameter, setParameter] = useState('voltage')
  const [series, setSeries] = useState([])
  const [stats, setStats] = useState([])
  const [error, setError] = useState(null)

  const currentMachine = machines.find((m) => m.device_id === selectedDeviceId)

  const loadMetrics = useCallback(async () => {
    try {
      setMetrics(await fetchMetrics())
    } catch (e) {
      // non-fatal
    }
  }, [])

  const loadLive = useCallback(async () => {
    if (!selectedDeviceId) return
    try {
      const [latestData, statusData] = await Promise.all([fetchLatest(selectedDeviceId), fetchStatus(selectedDeviceId)])
      setLatest(latestData)
      setStatus(statusData)
      setError(null)
    } catch (e) {
      setError('Could not reach the backend API. Is uvicorn running?')
    }
  }, [selectedDeviceId])

  const loadChart = useCallback(async () => {
    if (!selectedDeviceId) return
    try {
      const [seriesData, statsData] = await Promise.all([fetchReadings(range, selectedDeviceId), fetchStats(range, selectedDeviceId)])
      setSeries(seriesData)
      setStats(statsData)
    } catch (e) {
      setError('Could not reach the backend API. Is uvicorn running?')
    }
  }, [range, selectedDeviceId])

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
          <h1>{currentMachine?.machine_name || 'Chicken Feeder Monitor'}</h1>
          <p className="subtitle">
            {currentMachine?.machine_model ? `${currentMachine.machine_model} — ` : ''}
            Electrical parameters — automated pellet dispenser
          </p>
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
            <button className="export-btn" onClick={() => window.open(exportCsvUrl(range, selectedDeviceId), '_blank')}>
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
