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
  voltage: { color: '#f2a93b' },
  current: { color: '#5aa9e6' },
  power: { color: '#45d483' },
  battery_pct: { color: '#5aa9e6' },
}
const CORE_KEYS = new Set(Object.keys(CORE_META))

function formatTick(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function valueAccessor(parameter) {
  if (CORE_KEYS.has(parameter)) return parameter
  return (row) => (row.custom_metrics ? row.custom_metrics[parameter] : null)
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ background: 'var(--panel-raised)', border: '1px solid var(--border)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
      <div style={{ color: 'var(--ink-dim)', marginBottom: 4 }}>{formatTick(label)}</div>
      <div style={{ color: 'var(--ink)' }}>{payload[0].value?.toFixed?.(2) ?? payload[0].value}</div>
    </div>
  )
}

export default function TimeSeriesChart({ data, parameter }) {
  const color = CORE_META[parameter]?.color || '#f2a93b'

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
          tickFormatter={formatTick}
          stroke="var(--ink-dim)"
          tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-dim)' }}
          minTickGap={40}
        />
        <YAxis
          stroke="var(--ink-dim)"
          tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-dim)' }}
          width={44}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
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
