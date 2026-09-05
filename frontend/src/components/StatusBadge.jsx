export default function StatusBadge({ online, lastSeen }) {
  const label = online ? 'ONLINE' : 'OFFLINE'
  const timeLabel = lastSeen
    ? new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <div className="status-badge">
      <span className={`status-dot ${online ? 'online' : 'offline'}`} />
      <span>{label}</span>
      <span style={{ color: 'var(--ink-dim)' }}>· last seen {timeLabel}</span>
    </div>
  )
}
