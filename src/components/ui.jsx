import { useEffect } from 'react'
import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'

/* ---------------------------- Button ---------------------------- */

const VARIANTS = {
  primary: 'bg-brand-600 hover:bg-brand-500 text-white',
  secondary: 'bg-surface-muted hover:bg-surface-border text-slate-100 border border-surface-border',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white'
}

const SIZES = {
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3.5 text-lg',
  xl: 'px-6 py-4 text-xl'
}

export function Button({ children, variant = 'primary', size = 'lg', loading, className = '', disabled, ...rest }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all
        active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------------------------- Card ---------------------------- */

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-surface-border bg-surface-card p-4 shadow-lg ${className}`}>
      {children}
    </div>
  )
}

/* ---------------------------- Input ---------------------------- */

export function Input({ label, error, id, textarea, className = '', ...rest }) {
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-base font-medium text-slate-200">
          {label}
        </label>
      )}
      <Tag
        id={id}
        rows={textarea ? 3 : undefined}
        className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-base text-slate-100
          placeholder:text-slate-500 outline-none transition-colors
          ${error ? 'border-rose-500' : 'border-surface-border focus:border-brand-500'} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-rose-400">{error}</p>}
    </div>
  )
}

/* ---------------------------- Modal ---------------------------- */

export function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-surface-border bg-surface-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-surface-muted hover:text-slate-100">
            ✕
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-5 flex gap-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------------------- ConfirmDialog ---------------------------- */

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', loading, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={loading} className="flex-1">
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-base text-slate-300">{description}</p>
    </Modal>
  )
}

/* ---------------------------- EmptyState ---------------------------- */

export function EmptyState({ icon = '📋', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border bg-slate-950/50 px-6 py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      {description && <p className="max-w-sm text-base text-slate-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/* ---------------------------- ErrorMessage ---------------------------- */

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-rose-200">
      <p className="text-base">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 text-sm font-semibold text-rose-100 underline">
          Retry
        </button>
      )}
    </div>
  )
}

/* ---------------------------- LoadingSpinner ---------------------------- */

export function LoadingSpinner({ label = 'Loading…', fullScreen }) {
  const content = <p className="text-base text-slate-400">{label}</p>
  if (fullScreen) {
    return <div className="flex min-h-[60vh] w-full items-center justify-center">{content}</div>
  }
  return content
}

/* ---------------------------- StatCard ---------------------------- */

const ACCENTS = {
  brand: 'text-brand-400 bg-brand-500/10',
  green: 'text-emerald-400 bg-emerald-500/10',
  red: 'text-rose-400 bg-rose-500/10',
  amber: 'text-amber-400 bg-amber-500/10'
}

export function StatCard({ label, value, icon, accent = 'brand' }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${ACCENTS[accent]}`}>
          {icon}
        </span>
        <p className="text-sm font-medium text-slate-400">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-50">{value}</p>
    </Card>
  )
}

/* ---------------------------- ProtectedRoute ---------------------------- */

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner fullScreen label="Checking your session…" />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

/* ---------------------------- Layout ---------------------------- */

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/projects/new', label: 'New Project', icon: '➕' },
  { to: '/reports', label: 'Reports', icon: '📊' }
]

export function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg">🧱</span>
            <span className="text-lg font-bold tracking-tight text-slate-50">Site Ledger</span>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-base font-medium ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-surface-muted hover:text-white'
                  }`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 md:inline">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-surface-border px-3 py-2 text-sm font-medium text-slate-300 hover:bg-surface-muted hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:pb-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-surface-border bg-surface-card/95 backdrop-blur sm:hidden no-print">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-3 text-sm font-medium ${
                isActive ? 'text-brand-400' : 'text-slate-400'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
    }
