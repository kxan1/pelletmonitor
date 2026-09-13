import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('feeder_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Called by AuthContext to react to session expiry (401 on an authenticated
// request) from anywhere in the app — logs out and redirects to /login with
// a "previous session expired at ..." message, instead of leaving the user
// stuck seeing raw "Could not validate credentials" errors.
let unauthorizedHandler = null
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthedRequest = !!err.config?.headers?.Authorization
    const isLoginAttempt = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && isAuthedRequest && !isLoginAttempt && unauthorizedHandler) {
      unauthorizedHandler()
    }
    return Promise.reject(err)
  },
)

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

// ---------- Image uploads ----------
export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/uploads', formData)
  return data // { id, url }
}

// Uploaded images are stored as relative paths ("/uploads/5") since the
// backend doesn't know its own public URL — resolve against our known API
// base here. External URLs (someone pasting a link) pass through as-is.
export function resolveImageUrl(url) {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${baseURL}${url}`
}

// ---------- Auth ----------
export async function loginRequest(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function registerRequest(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data
}

export async function changeCredentials(payload) {
  const { data } = await api.put('/auth/me', payload)
  return data
}

// ---------- Admin: user approval ----------
export async function fetchPendingUsers() {
  const { data } = await api.get('/admin/users/pending')
  return data
}

export async function fetchAllUsers() {
  const { data } = await api.get('/admin/users')
  return data
}

export async function approveUser(userId) {
  const { data } = await api.put(`/admin/users/${userId}/approve`)
  return data
}

export async function updateUserRole(userId, role) {
  const { data } = await api.put(`/admin/users/${userId}/role`, { role })
  return data
}

export async function removeUser(userId) {
  const { data } = await api.delete(`/admin/users/${userId}`)
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

export async function fetchReadingContext(readingId, windowMinutes = 30) {
  const { data } = await api.get(`/readings/${readingId}/context`, { params: { window_minutes: windowMinutes } })
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
