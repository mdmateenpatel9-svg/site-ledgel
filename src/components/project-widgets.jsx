import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Input, Modal } from './ui'
import { EXPENSE_CATEGORIES, formatCurrency, formatDate, todayISO } from '../lib/utils'

/* ---------------------------- ProjectCard ---------------------------- */

export function ProjectCard({ project }) {
  const isCompleted = project.status === 'completed'
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-2xl border border-surface-border bg-surface-card p-4 shadow-lg hover:border-brand-600/60 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">{project.project_name}</h3>
          <p className="text-base text-slate-400">{project.customer_name}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
            isCompleted ? 'bg-emerald-500/15 text-emerald-400' : 'bg-brand-500/15 text-brand-400'
          }`}
        >
          {isCompleted ? 'Completed' : 'Active'}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
        <span>Started {formatDate(project.start_date)}</span>
        <span className="text-base font-semibold text-slate-200">{formatCurrency(project.deal_amount)}</span>
      </div>
    </Link>
  )
}

/* ---------------------------- ProjectForm ---------------------------- */

export function ProjectForm({ onSubmit, submitting }) {
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    projectName: '',
    dealAmount: '',
    startDate: todayISO(),
    notes: ''
  })
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate() {
    const next = {}
    if (!form.customerName.trim()) next.customerName = 'Customer name is required.'
    if (!form.projectName.trim()) next.projectName = 'Project name is required.'
    if (!form.dealAmount || Number(form.dealAmount) <= 0) next.dealAmount = 'Enter a deal amount greater than ₹0.'
    if (!form.startDate) next.startDate = 'Start date is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="customerName" label="Customer Name" value={form.customerName} onChange={(e) => update('customerName', e.target.value)} error={errors.customerName} />
      <Input id="phone" label="Phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
      <Input id="address" label="Address" textarea value={form.address} onChange={(e) => update('address', e.target.value)} />
      <Input id="projectName" label="Project Name" value={form.projectName} onChange={(e) => update('projectName', e.target.value)} error={errors.projectName} />
      <Input id="dealAmount" label="Deal Amount (₹)" type="number" min="0" value={form.dealAmount} onChange={(e) => update('dealAmount', e.target.value)} error={errors.dealAmount} />
      <Input id="startDate" label="Start Date" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} error={errors.startDate} />
      <Input id="notes" label="Notes" textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      <Button type="submit" size="xl" className="w-full" loading={submitting}>
        Save Project
      </Button>
    </form>
  )
}

/* ---------------------------- ExpenseButtonGrid ---------------------------- */

export function ExpenseButtonGrid({ onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {EXPENSE_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-surface-border bg-surface-card px-4 py-6 text-lg font-semibold text-slate-100 shadow-lg hover:border-brand-600/60 hover:bg-surface-muted active:scale-[0.97]"
        >
          <span className="text-3xl">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------------------- ExpenseModal ---------------------------- */

export function ExpenseModal({ open, category, onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.value === category)

  function reset() {
    setAmount('')
    setDate(todayISO())
    setNote('')
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSave() {
    if (!amount || Number(amount) <= 0) {
      setError('Enter an amount greater than ₹0.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ category, amount, date, note })
      reset()
    } catch (err) {
      setError(err.message || 'Could not save this expense.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={`${categoryInfo?.icon || ''} ${categoryInfo?.label || 'Expense'}`}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} className="flex-1">
            Save
          </Button>
        </>
      }
    >
      <Input label="Amount (₹)" type="number" min="0" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} error={error} />
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input label="Note" textarea placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
    </Modal>
  )
}

/* ---------------------------- PaymentModal ---------------------------- */

export function PaymentModal({ open, onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function reset() {
    setAmount('')
    setDate(todayISO())
    setNote('')
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSave() {
    if (!amount || Number(amount) <= 0) {
      setError('Enter an amount greater than ₹0.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ amount, date, note })
      reset()
    } catch (err) {
      setError(err.message || 'Could not save this payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="💰 Payment Received"
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} className="flex-1">
            Save
          </Button>
        </>
      }
    >
      <Input label="Amount (₹)" type="number" min="0" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} error={error} />
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input label="Note" textarea placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
    </Modal>
  )
}

/* ---------------------------- ProjectSummaryCards ---------------------------- */

const SUMMARY_ITEMS = [
  { key: 'totalAmount', label: 'Total Amount', accent: 'text-slate-100' },
  { key: 'receivedAmount', label: 'Received', accent: 'text-emerald-400' },
  { key: 'pendingAmount', label: 'Pending', accent: 'text-amber-400' },
  { key: 'totalExpense', label: 'Total Expense', accent: 'text-rose-400' },
  { key: 'profit', label: 'Profit', accent: 'text-brand-400' }
]

export function ProjectSummaryCards({ financials }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {SUMMARY_ITEMS.map((item) => (
        <Card key={item.key} className="p-4">
          <p className="text-sm font-medium text-slate-400">{item.label}</p>
          <p className={`mt-1 text-xl font-bold tracking-tight ${item.accent}`}>{formatCurrency(financials[item.key])}</p>
        </Card>
      ))}
    </div>
  )
}
