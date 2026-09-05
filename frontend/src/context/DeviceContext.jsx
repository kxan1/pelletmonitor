import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchMachines } from '../api/client'

const DeviceContext = createContext(null)

const FALLBACK_DEVICE_ID = 'esp32-feeder-01'

export function DeviceProvider({ children }) {
  const [machines, setMachines] = useState([])
  const [selectedDeviceId, setSelectedDeviceIdState] = useState(
    () => localStorage.getItem('feeder_selected_device') || FALLBACK_DEVICE_ID,
  )
  const [loading, setLoading] = useState(true)

  const refreshMachines = useCallback(async () => {
    try {
      const list = await fetchMachines()
      setMachines(list)
      // If the currently selected device no longer exists (deleted, or
      // this is first load), fall back to the first available machine.
      setSelectedDeviceIdState((current) => {
        if (list.some((m) => m.device_id === current)) return current
        return list[0]?.device_id || FALLBACK_DEVICE_ID
      })
    } catch (e) {
      // Non-fatal — dashboard falls back to the default device_id
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refreshMachines() }, [refreshMachines])

  const setSelectedDeviceId = useCallback((id) => {
    localStorage.setItem('feeder_selected_device', id)
    setSelectedDeviceIdState(id)
  }, [])

  return (
    <DeviceContext.Provider value={{ machines, selectedDeviceId, setSelectedDeviceId, refreshMachines, loading }}>
      {children}
    </DeviceContext.Provider>
  )
}

export function useDevice() {
  const ctx = useContext(DeviceContext)
  if (!ctx) throw new Error('useDevice must be used inside DeviceProvider')
  return ctx
}
