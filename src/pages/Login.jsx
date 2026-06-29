import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { Input, Button, ErrorMessage } from '../components/ui'

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        navigate('/')
      } else {
        await signUp(email, password)
        setInfo('Account created. Check your email if confirmation is required, then sign in.')
        setMode('signin')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-3xl">🧱</span>
          <h1 className="text-2xl font-bold text-slate-50">Site Ledger</h1>
          <p className="text-base text-slate-400">Tiles &amp; Granite project tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <ErrorMessage message={error} />
          {info && (
            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/40 px-4 py-3 text-base text-emerald-200">
              {info}
            </div>
          )}

          <Button type="submit" size="xl" className="w-full" loading={submitting}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
            setInfo('')
          }}
          className="mt-5 w-full text-center text-base text-brand-400 hover:text-brand-300"
        >
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
          }
