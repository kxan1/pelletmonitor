import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../api/client'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the link.')
      return
    }
    api.get('/auth/verify-email', { params: { token } })
      .then((res) => {
        setStatus('success')
        setMessage(res.data.message)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'Verification failed.')
      })
  }, [token])

  return (
    <div className="app-shell narrow">
      <div className="form-panel">
        <h2>Email Verification</h2>
        {status === 'verifying' && <p className="subtitle">Verifying…</p>}
        {status === 'success' && <p style={{ color: 'var(--green)' }}>{message}</p>}
        {status === 'error' && <p style={{ color: 'var(--red)' }}>{message}</p>}
        <Link to="/login"><button className="primary-btn" style={{ marginTop: 16 }}>Go to Login</button></Link>
      </div>
    </div>
  )
}
