import { useTheme } from '../context/ThemeContext'
import ImageUploader from '../components/ImageUploader'

export default function Settings() {
  const { theme, toggleTheme, backgroundUrl, setBackgroundUrl } = useTheme()

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
          Upload or drag in an image to use as the page background. Leave empty to use the default.
        </p>
        <ImageUploader value={backgroundUrl} onChange={setBackgroundUrl} label="Background Image" category="background" />
      </div>
    </div>
  )
}
