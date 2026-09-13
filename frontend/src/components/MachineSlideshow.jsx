import { useState, useEffect } from 'react'
import { useDevice } from '../context/DeviceContext'

const SLIDE_INTERVAL_MS = 5000

export default function MachineSlideshow() {
  const { machines, selectedDeviceId, setSelectedDeviceId } = useDevice()
  const withImages = machines.filter((m) => m.image_url)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (withImages.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % withImages.length), SLIDE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [withImages.length])

  if (withImages.length === 0) return null

  const current = withImages[index % withImages.length]
  const isSelected = current.device_id === selectedDeviceId

  return (
    <div className="slideshow">
      <img
        src={current.image_url}
        alt={current.machine_name}
        className="slideshow-image"
        onClick={() => setSelectedDeviceId(current.device_id)}
      />
      <div className="slideshow-caption">
        <span>{current.machine_name}{isSelected ? ' (currently viewing)' : ''}</span>
        {withImages.length > 1 && (
          <div className="slideshow-dots">
            {withImages.map((m, i) => (
              <button
                key={m.device_id}
                className={`slideshow-dot ${i === index ? 'active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Show ${m.machine_name}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
