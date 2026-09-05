const PARAM_LABELS = { voltage: 'Voltage (V)', current: 'Current (A)', power: 'Power (W)' }

export default function StatsSummary({ stats }) {
  if (!stats || stats.length === 0) {
    return null
  }

  return (
    <div className="stats-grid">
      {stats.map((s) => (
        <div className="stats-panel" key={s.parameter}>
          <h3>{PARAM_LABELS[s.parameter] || s.parameter}</h3>
          <div className="stats-row">
            <span>Min</span>
            <span>{s.min !== null && s.min !== undefined ? s.min.toFixed(2) : '—'}</span>
          </div>
          <div className="stats-row">
            <span>Avg</span>
            <span>{s.avg !== null && s.avg !== undefined ? s.avg.toFixed(2) : '—'}</span>
          </div>
          <div className="stats-row">
            <span>Max</span>
            <span>{s.max !== null && s.max !== undefined ? s.max.toFixed(2) : '—'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
