export default function ReadoutPanel({ label, value, unit, isBattery = false }) {
  const display = value === null || value === undefined ? '—' : value.toFixed(2)

  return (
    <div className="readout-panel">
      <p className="readout-label">{label}</p>
      <div className={`readout-value ${isBattery ? 'battery' : ''}`}>
        {display}
        <span className="readout-unit">{unit}</span>
      </div>
    </div>
  )
}
