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
          This dashboard makes that data publicly viewable, with historical trends and
          exportable records.
        </p>
        <h3>Tech stack</h3>
        <ul>
          <li>Hardware: ESP32 + voltage/current sensors, Blynk IoT platform</li>
          <li>Backend: Python, FastAPI, PostgreSQL</li>
          <li>Frontend: React, Vite, Recharts</li>
        </ul>

        <h3>About the Developer</h3>
        <div className="about-dev-card">
          <img
            src="https://via.placeholder.com/140x140?text=Your+Photo"
            alt="Developer placeholder"
            className="about-dev-photo"
          />
          <div>
            <p style={{ marginTop: 0 }}>
              [Placeholder — replace this paragraph in <code>frontend/src/pages/About.jsx</code>
              with a short introduction: your name, program/year, and what this capstone project
              means to you. Keep it to 2-4 sentences.]
            </p>
            <a href="https://github.com/kxan1/pelletmonitor" target="_blank" rel="noreferrer">
              View source on GitHub →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
