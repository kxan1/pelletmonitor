import { useDevice } from '../context/DeviceContext'

export default function MachineSelector() {
  const { machines, selectedDeviceId, setSelectedDeviceId, loading } = useDevice()

  if (loading || machines.length === 0) return null

  // Single machine: no point showing a dropdown with one option.
  if (machines.length === 1) {
    return <span className="machine-selector-single">{machines[0].machine_name}</span>
  }

  return (
    <select
      className="param-select machine-selector"
      value={selectedDeviceId}
      onChange={(e) => setSelectedDeviceId(e.target.value)}
      title="Switch machine"
    >
      {machines.map((m) => (
        <option key={m.device_id} value={m.device_id}>
          {m.machine_name}
        </option>
      ))}
    </select>
  )
}
