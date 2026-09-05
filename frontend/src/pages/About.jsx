export default function About() {
  return (
    <div className="app-shell narrow">
      <h1 className="page-title">About This System</h1>
      <div className="prose">
        <p>
          This dashboard monitors the electrical performance of an ESP32-based automated
          chicken feed pellet dispenser. It replaces a developer-only Blynk view with a
          public-facing, real-time monitoring system with historical charting and data logging.
        </p>
        <h3>Why it exists</h3>
        <p>
          The pellet machine's sensors (voltage, current, power, and battery health) were
          previously only visible to the developer through the Arduino IDE and the Blynk app.
          This meant investors, college staff, and the general public had no way to independently
          verify the system was working as claimed. This dashboard makes that data publicly
          viewable, with historical trends and exportable records.
        </p>
        <h3>How it works</h3>
        <p>
          The ESP32 continues to report to Blynk exactly as before — nothing about the original
          firmware or Blynk setup was changed. A bridge script polls Blynk's API and forwards
          each reading into a PostgreSQL database. A FastAPI backend serves that data to this
          React dashboard, which anyone can view.
        </p>
        <h3>Tech stack</h3>
        <ul>
          <li>Hardware: ESP32 + voltage/current sensors, Blynk IoT platform</li>
          <li>Backend: Python, FastAPI, PostgreSQL</li>
          <li>Frontend: React, Vite, Recharts</li>
        </ul>
      </div>
    </div>
  )
}
