import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject } from '../hooks'
import { Card, Button, LoadingSpinner, ErrorMessage, EmptyState, ConfirmDialog } from '../components/ui'
import {
  ProjectSummaryCards,
  ExpenseButtonGrid,
  ExpenseModal,
  PaymentModal
} from '../components/project-widgets'
import { addExpense, addPayment, updateProjectStatus, logReport } from '../lib/supabaseClient'
import { generateProjectPDF, formatCurrency, formatDate, EXPENSE_CATEGORIES } from '../lib/utils'

export default function ProjectDetail() {
  const { id } = useParams()
  const { project, payments, expenses, financials, loading, error, refresh, setProject } = useProject(id)

  const [expenseCategory, setExpenseCategory] = useState(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [actionError, setActionError] = useState('')

  if (loading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error} onRetry={refresh} />
  if (!project) return null

  async function handleSaveExpense({ category, amount, date, note }) {
    await addExpense(project.id, { category, amount, date, note })
    setExpenseCategory(null)
    refresh()
  }

  async function handleSavePayment({ amount, date, note }) {
    await addPayment(project.id, { amount, date, note })
    setPaymentOpen(false)
    refresh()
  }

  async function handleComplete() {
    setCompleting(true)
    setActionError('')
    try {
      const updated = await updateProjectStatus(project.id, 'completed')
      setProject(updated)
      setConfirmOpen(false)
    } catch (err) {
      setActionError(err.message || 'Could not update project status.')
    } finally {
      setCompleting(false)
    }
  }

  async function handleDownloadPDF() {
    generateProjectPDF({ project, payments, expenses, financials })
    await logReport({ reportType: 'project', projectId: project.id })
  }

  const timeline = [
    ...payments.map((p) => ({ id: `payment-${p.id}`, type: 'payment', date: p.payment_date, amount: p.amount, note: p.note, label: 'Payment received' })),
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      type: 'expense',
      date: e.expense_date,
      amount: e.amount,
      note: e.note,
      label: EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const isCompleted = project.status === 'completed'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-50">{project.project_name}</h1>
          <p className="text-base text-slate-400">
            {project.customer_name} {project.phone ? `· ${project.phone}` : ''}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
            isCompleted ? 'bg-emerald-500/15 text-emerald-400' : 'bg-brand-500/15 text-brand-400'
          }`}
        >
          {isCompleted ? 'Completed' : 'Active'}
        </span>
      </div>

      <ErrorMessage message={actionError} />

      <ProjectSummaryCards financials={financials} />

      {!isCompleted && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Add Expense</h2>
          <ExpenseButtonGrid onSelect={setExpenseCategory} />
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {!isCompleted && (
          <Button onClick={() => setPaymentOpen(true)} className="flex-1 sm:flex-none">
            💰 Add Payment
          </Button>
        )}
        <Button variant="secondary" onClick={handleDownloadPDF} className="flex-1 sm:flex-none">
          ⬇️ Download PDF
        </Button>
        {!isCompleted && (
          <Button variant="secondary" onClick={() => setConfirmOpen(true)} className="flex-1 sm:flex-none">
            ✅ Mark as Completed
          </Button>
        )}
      </div>

      {project.address && (
        <Card>
          <h2 className="mb-1 text-base font-semibold text-slate-300">Address</h2>
          <p className="text-base text-slate-400">{project.address}</p>
        </Card>
      )}

      {project.notes && (
        <Card>
          <h2 className="mb-1 text-base font-semibold text-slate-300">Notes</h2>
          <p className="whitespace-pre-wrap text-base text-slate-400">{project.notes}</p>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-xl font-semibold text-slate-100">Activity</h2>
        {timeline.length === 0 ? (
          <EmptyState icon="🧾" title="No activity yet" description="Payments and expenses you log will show up here." />
        ) : (
          <div className="space-y-2">
            {timeline.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-card px-4 py-3">
                <div>
                  <p className="text-base font-medium text-slate-100">{item.label}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(item.date)} {item.note ? `· ${item.note}` : ''}
                  </p>
                </div>
                <p className={`text-base font-semibold ${item.type === 'payment' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.type === 'payment' ? '+' : '-'}
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExpenseModal
        open={Boolean(expenseCategory)}
        category={expenseCategory}
        onClose={() => setExpenseCategory(null)}
        onSave={handleSaveExpense}
      />

      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onSave={handleSavePayment} />

      <ConfirmDialog
        open={confirmOpen}
        title="Mark project as completed?"
        description="The project stays saved with full history. You can still view its report, but new expenses and payments won't be added."
        confirmLabel="Mark Completed"
        loading={completing}
        onConfirm={handleComplete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
