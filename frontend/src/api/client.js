import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL })

// Attach the JWT (if we have one) to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('feeder_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const DEVICE_ID = 'esp32-feeder-01'

// ---------- Public dashboard data ----------
export async function fetchLatest(deviceId = DEVICE_ID) {
  const { data } = await api.get('/readings/latest', { params: { device_id: deviceId } })
  return data
}

export async function fetchReadings(range = '1h', deviceId = DEVICE_ID) {
  const { data } = await api.get('/readings', { params: { range, device_id: deviceId } })
  return data
}

export async function fetchStats(range = '1h', deviceId = DEVICE_ID) {
  const { data } = await api.get('/readings/stats', { params: { range, device_id: deviceId } })
  return data
}

export async function fetchStatus(deviceId = DEVICE_ID) {
  const { data } = await api.get('/status', { params: { device_id: deviceId } })
  return data
}

export function exportCsvUrl(range = '1h', deviceId = DEVICE_ID) {
  return `${baseURL}/export/csv?range=${range}&device_id=${deviceId}`
}

export async function fetchMetrics() {
  const { data } = await api.get('/metrics')
  return data
}

export async function fetchMachines() {
  const { data } = await api.get('/machines')
  return data
}

// ---------- Auth ----------
export async function loginRequest(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data
}

// ---------- Admin: metric ("key") management ----------
export async function createMetric(metric) {
  const { data } = await api.post('/metrics', metric)
  return data
}

export async function updateMetric(key, metric) {
  const { data } = await api.put(`/metrics/${key}`, metric)
  return data
}

export async function deleteMetric(key) {
  const { data } = await api.delete(`/metrics/${key}`)
  return data
}

// ---------- Admin: machine management ----------
export async function createMachine(machine) {
  const { data } = await api.post('/machines', machine)
  return data
}

export async function updateMachine(deviceId, machine) {
  const { data } = await api.put(`/machines/${deviceId}`, machine)
  return data
}

export async function deleteMachine(deviceId) {
  const { data } = await api.delete(`/machines/${deviceId}`)
  return data
}

// ---------- Admin: readings CRUD ----------
export async function fetchReadingsTable(deviceId = DEVICE_ID, limit = 50, offset = 0) {
  const { data } = await api.get('/readings/table', { params: { device_id: deviceId, limit, offset } })
  return data
}

export async function updateReading(id, patch) {
  const { data } = await api.put(`/readings/${id}`, patch)
  return data
}

export async function deleteReading(id) {
  const { data } = await api.delete(`/readings/${id}`)
  return data
}
