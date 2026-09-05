import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const { theme, toggleTheme, backgroundUrl, setBackgroundUrl } = useTheme()
  const [draft, setDraft] = useState(backgroundUrl)

  return (
    <div className="app-shell narrow">
      <h1 className="page-title">Display Settings</h1>
      <div className="chart-panel">
        <h3 style={{ marginTop: 0 }}>Theme</h3>
        <p className="subtitle" style={{ marginBottom: 12 }}>Current: {theme === 'dark' ? 'Dark' : 'Light'}</p>
        <button className="primary-btn" onClick={toggleTheme}>
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      <div className="chart-panel" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Custom Background</h3>
        <p className="subtitle" style={{ marginBottom: 12 }}>
          Paste an image URL to use as the page background. Leave empty to use the default.
        </p>
        <input
          className="form-input"
          placeholder="https://example.com/your-image.jpg"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="primary-btn" onClick={() => setBackgroundUrl(draft)}>Apply</button>
          <button className="export-btn" onClick={() => { setDraft(''); setBackgroundUrl('') }}>Clear</button>
        </div>
      </div>
    </div>
  )
}
