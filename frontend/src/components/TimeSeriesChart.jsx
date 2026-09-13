import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const CORE_META = {
  voltage: { color: '#f2a93b', unit: 'V' },
  current: { color: '#5aa9e6', unit: 'A' },
  power: { color: '#45d483', unit: 'W' },
  battery_pct: { color: '#5aa9e6', unit: '%' },
}
const CORE_KEYS = new Set(Object.keys(CORE_META))

// Ranges spanning a day or more need the date shown, not just the time,
// otherwise "08:24 AM" is ambiguous across a week of data.
const DATE_AWARE_RANGES = new Set(['1d', '1wk'])

function formatAxisTick(iso, range) {
  const d = new Date(iso)
  if (DATE_AWARE_RANGES.has(range)) {
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatTooltipLabel(iso) {
  // Tooltip always shows the full date + time, regardless of range,
  // since precision matters more there than in the compact axis ticks.
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function valueAccessor(parameter) {
  if (CORE_KEYS.has(parameter)) return parameter
  return (row) => (row.custom_metrics ? row.custom_metrics[parameter] : null)
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ background: 'var(--panel-raised)', border: '1px solid var(--border)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
      <div style={{ color: 'var(--ink-dim)', marginBottom: 4 }}>{formatTooltipLabel(label)}</div>
      <div style={{ color: 'var(--ink)' }}>{payload[0].value?.toFixed?.(2) ?? payload[0].value} {unit}</div>
    </div>
  )
}

export default function TimeSeriesChart({ data, parameter, range, customUnit }) {
  const meta = CORE_META[parameter]
  const color = meta?.color || '#f2a93b'
  const unit = meta?.unit ?? customUnit ?? ''

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        No readings in this time window yet.
        <br />
        Confirm the Blynk bridge is running and pushing data to /ingest.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="recorded_at"
          tickFormatter={(iso) => formatAxisTick(iso, range)}
          stroke="var(--ink-dim)"
          tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-dim)' }}
          minTickGap={DATE_AWARE_RANGES.has(range) ? 60 : 40}
        />
        <YAxis
          stroke="var(--ink-dim)"
          tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-dim)' }}
          width={52}
          domain={['auto', 'auto']}
          label={unit ? { value: unit, angle: -90, position: 'insideLeft', fill: 'var(--ink-dim)', fontSize: 11, style: { fontFamily: 'var(--font-mono)' } } : undefined}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Line
          type="monotone"
          dataKey={valueAccessor(parameter)}
          stroke={color}
          strokeWidth={1.75}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
