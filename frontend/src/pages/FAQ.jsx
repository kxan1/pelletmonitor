const FAQS = [
  {
    q: 'What does "ONLINE" / "OFFLINE" mean?',
    a: 'ONLINE means the system has received a new sensor reading within the last few polling cycles. OFFLINE means no new data has arrived recently — usually because the ESP32 lost WiFi, or the Blynk bridge script isn\'t running.',
  },
  {
    q: 'Why does the chart look empty for a time range?',
    a: 'The database only has data from whenever logging started. If you select "1 Week" shortly after deployment, there won\'t be a full week of history yet — this fills in over time.',
  },
  {
    q: 'How is Power calculated?',
    a: 'Power is read directly from its own sensor/vPin (or computed as Voltage × Current, depending on how your ESP32 firmware reports it — check your sketch to confirm which).',
  },
  {
    q: 'Can I download the data?',
    a: 'Yes — use the "Export CSV" button on the dashboard. The file opens directly in OriginPro (File > Import) or Power BI (Get Data > Text/CSV).',
  },
  {
    q: 'Who can edit the logged data?',
    a: 'Only logged-in admins can edit or delete readings, add new sensor parameters, or update machine info. Everyone else has read-only access to the live dashboard.',
  },
  {
    q: 'Does this affect the existing Blynk app?',
    a: 'No. The ESP32 firmware and Blynk setup are completely unchanged — this dashboard reads the same data through a separate bridge script.',
  },
]

export default function FAQ() {
  return (
    <div className="app-shell narrow">
      <h1 className="page-title">FAQ</h1>
      <div className="prose">
        {FAQS.map((item, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 6 }}>{item.q}</h3>
            <p style={{ marginTop: 0 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
