import { useState, useRef } from 'react'
import { uploadImage, resolveImageUrl } from '../api/client'

const MAX_BYTES = 3 * 1024 * 1024

export default function ImageUploader({ value, onChange, label = 'Image' }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image is too large (max 3MB).')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const result = await uploadImage(file)
      onChange(result.url)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div>
      <label className="form-label">{label}</label>
      <div
        className={`image-uploader ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={resolveImageUrl(value)} alt="" className="image-uploader-preview" />
        ) : (
          <div className="image-uploader-placeholder">
            {uploading ? 'Uploading…' : 'Drag & drop an image, or click to browse'}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {value && (
        <button
          type="button"
          className="export-btn"
          style={{ marginTop: 8 }}
          onClick={(e) => { e.stopPropagation(); onChange('') }}
        >
          Remove Image
        </button>
      )}
      {error && <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
