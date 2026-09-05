const RANGES = [
  { key: 'live', label: 'LIVE' },
  { key: '3m', label: '3M' },
  { key: '5m', label: '5M' },
  { key: '1h', label: '1H' },
  { key: '3h', label: '3H' },
  { key: '1d', label: '1D' },
  { key: '1wk', label: '1WK' },
]

export default function TimeRangeTabs({ value, onChange }) {
  return (
    <div className="tab-row">
      {RANGES.map((r) => (
        <button
          key={r.key}
          className={`tab-btn ${value === r.key ? 'active' : ''}`}
          onClick={() => onChange(r.key)}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
