import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchSiteSettings, updateSiteSettings, resolveImageUrl } from '../api/client'
import ImageUploader from '../components/ImageUploader'

export default function About() {
  const { isAdmin } = useAuth()
  const [settings, setSettings] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSiteSettings().then((data) => {
      setSettings(data)
      setDraft(data)
    }).catch(() => {})
  }, [])

  async function handleSave() {
    try {
      const updated = await updateSiteSettings(draft)
      setSettings(updated)
      setEditing(false)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save.')
    }
  }

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

        {isAdmin && (
          <button className="export-btn" style={{ marginBottom: 12 }} onClick={() => { setEditing(!editing); setDraft(settings) }}>
            {editing ? 'Cancel' : 'Edit This Section'}
          </button>
        )}

        {editing ? (
          <div className="chart-panel">
            <ImageUploader
              value={draft.developer_photo_url}
              onChange={(url) => setDraft({ ...draft, developer_photo_url: url })}
              label="Your Photo"
              category="developer"
            />
            <label className="form-label">Name</label>
            <input className="form-input" value={draft.developer_name || ''}
              onChange={(e) => setDraft({ ...draft, developer_name: e.target.value })} />
            <label className="form-label">Introduction</label>
            <textarea className="form-input" rows={4} value={draft.developer_intro || ''}
              onChange={(e) => setDraft({ ...draft, developer_intro: e.target.value })} />
            <label className="form-label">GitHub URL</label>
            <input className="form-input" value={draft.github_url || ''}
              onChange={(e) => setDraft({ ...draft, github_url: e.target.value })} />
            {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
            <button className="primary-btn" onClick={handleSave}>Save</button>
          </div>
        ) : (
          <div className="about-dev-card">
            {settings?.developer_photo_url ? (
              <img src={resolveImageUrl(settings.developer_photo_url)} alt={settings.developer_name || ''} className="about-dev-photo" />
            ) : (
              <div className="about-dev-photo about-dev-photo-placeholder">No photo yet</div>
            )}
            <div>
              {settings?.developer_name && <p style={{ marginTop: 0, fontWeight: 600 }}>{settings.developer_name}</p>}
              <p style={{ marginTop: 0 }}>
                {settings?.developer_intro || (isAdmin
                  ? 'No introduction yet — click "Edit This Section" above to add one.'
                  : 'Introduction coming soon.')}
              </p>
              {settings?.github_url && (
                <a href={settings.github_url} target="_blank" rel="noreferrer">View source on GitHub →</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
