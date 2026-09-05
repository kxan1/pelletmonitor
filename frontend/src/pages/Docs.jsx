export default function Docs() {
  return (
    <div className="app-shell narrow">
      <h1 className="page-title">Documentation &amp; SOP</h1>
      <p className="subtitle" style={{ marginBottom: 20 }}>
        This is a starting template — replace the placeholder text below with your actual
        system manual and standard operating procedure. Edit{' '}
        <code>frontend/src/pages/Docs.jsx</code> directly.
      </p>
      <div className="prose">
        <h3>1. System Overview</h3>
        <p>
          [Describe the pellet machine: dispensing mechanism, capacity, power source
          (mains/solar/battery), and how the ESP32 fits into the electrical circuit.]
        </p>

        <h3>2. Startup Procedure</h3>
        <ol>
          <li>[Step 1 — e.g. verify battery charge before power-on]</li>
          <li>[Step 2 — e.g. power on the control unit]</li>
          <li>[Step 3 — e.g. confirm the dashboard shows "ONLINE" within 30 seconds]</li>
        </ol>

        <h3>3. Shutdown Procedure</h3>
        <ol>
          <li>[Step 1]</li>
          <li>[Step 2]</li>
        </ol>

        <h3>4. Routine Maintenance</h3>
        <ul>
          <li>[e.g. Weekly: clear pellet chute of debris]</li>
          <li>[e.g. Monthly: inspect wiring and sensor connections]</li>
          <li>[e.g. Check battery health readout stays above X% before scheduled feeds]</li>
        </ul>

        <h3>5. Troubleshooting</h3>
        <table className="data-table" style={{ marginTop: 12 }}>
          <thead><tr><th>Symptom</th><th>Likely Cause</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td>Dashboard shows OFFLINE</td><td>ESP32 lost WiFi, or bridge script stopped</td><td>[Your steps here]</td></tr>
            <tr><td>Voltage reads 0</td><td>Sensor disconnected</td><td>[Your steps here]</td></tr>
            <tr><td>Battery draining unusually fast</td><td>[Your diagnosis]</td><td>[Your steps here]</td></tr>
          </tbody>
        </table>

        <h3>6. Safety Notes</h3>
        <p>[Any electrical safety warnings relevant to servicing this unit.]</p>
      </div>
    </div>
  )
}
