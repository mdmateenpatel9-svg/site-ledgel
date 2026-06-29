import { useEffect, useState } from 'react'
import { Card, Button, Input, LoadingSpinner, ErrorMessage, EmptyState } from '../components/ui'
import { useProjects, useProject } from '../hooks'
import { getDailyReportData, getMonthlyReportData, logReport } from '../lib/supabaseClient'
import { generatePeriodPDF, generateProjectPDF, formatCurrency, formatDate, todayISO, MONTH_NAMES } from '../lib/utils'

const TABS = [
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'project', label: 'Project' }
]

export default function Reports() {
  const [tab, setTab] = useState('daily')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-50">Reports</h1>

      <div className="flex gap-2 rounded-2xl border border-surface-border bg-surface-card p-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl py-2.5 text-base font-semibold ${
              tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'daily' && <DailyReport />}
      {tab === 'monthly' && <MonthlyReport />}
      {tab === 'project' && <ProjectReport />}
    </div>
  )
}

function PeriodSummary({ totalIncome, totalExpense, payments, expenses, onDownload }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-sm text-slate-400">Income</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Expense</p>
          <p className="mt-1 text-lg font-bold text-rose-400">{formatCurrency(totalExpense)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Net</p>
          <p className="mt-1 text-lg font-bold text-brand-400">{formatCurrency(totalIncome - totalExpense)}</p>
        </Card>
      </div>

      <Button variant="secondary" className="w-full" onClick={onDownload}>
        ⬇️ Download PDF
      </Button>

      {payments.length === 0 && expenses.length === 0 ? (
        <EmptyState icon="📊" title="No activity in this period" />
      ) : (
        <div className="space-y-2">
          {[...payments.map((p) => ({ ...p, kind: 'payment' })), ...expenses.map((e) => ({ ...e, kind: 'expense' }))]
            .sort((a, b) => new Date(b.payment_date || b.expense_date) - new Date(a.payment_date || a.expense_date))
            .map((item) => (
              <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-card px-4 py-3">
                <div>
                  <p className="text-base font-medium text-slate-100">{item.projects?.project_name || 'Project'}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(item.payment_date || item.expense_date)} · {item.kind === 'payment' ? 'Payment' : item.category}
                  </p>
                </div>
                <p className={`text-base font-semibold ${item.kind === 'payment' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.kind === 'payment' ? '+' : '-'}
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function DailyReport() {
  const [date, setDate] = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getDailyReportData(date)
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.message || 'Could not load report.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [date])

  async function handleDownload() {
    if (!data) return
    generatePeriodPDF({
      title: `Daily Report — ${formatDate(date)}`,
      fileName: `daily_report_${date}.pdf`,
      payments: data.payments,
      expenses: data.expenses,
      totalIncome: data.totalIncome,
      totalExpense: data.totalExpense
    })
    await logReport({ reportType: 'daily', reportPeriod: date })
  }

  return (
    <div className="space-y-4">
      <Input id="reportDate" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <ErrorMessage message={error} />
      {loading ? <LoadingSpinner /> : data && <PeriodSummary {...data} onDownload={handleDownload} />}
    </div>
  )
}

function MonthlyReport() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getMonthlyReportData(year, month)
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.message || 'Could not load report.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [year, month])

  async function handleDownload() {
    if (!data) return
    generatePeriodPDF({
      title: `Monthly Report — ${MONTH_NAMES[month - 1]} ${year}`,
      fileName: `monthly_report_${year}_${month}.pdf`,
      payments: data.payments,
      expenses: data.expenses,
      totalIncome: data.totalIncome,
      totalExpense: data.totalExpense
    })
    await logReport({ reportType: 'monthly', reportPeriod: `${year}-${String(month).padStart(2, '0')}` })
  }

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-base font-medium text-slate-200">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full rounded-xl border border-surface-border bg-slate-950 px-4 py-3 text-base text-slate-100 outline-none focus:border-brand-500"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-base font-medium text-slate-200">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full rounded-xl border border-surface-border bg-slate-950 px-4 py-3 text-base text-slate-100 outline-none focus:border-brand-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ErrorMessage message={error} />
      {loading ? <LoadingSpinner /> : data && <PeriodSummary {...data} onDownload={handleDownload} />}
    </div>
  )
}

function ProjectReport() {
  const { projects, loading: projectsLoading } = useProjects()
  const [projectId, setProjectId] = useState('')
  const { project, payments, expenses, financials, loading } = useProject(projectId || undefined)

  useEffect(() => {
    if (!projectId && projects.length > 0) setProjectId(projects[0].id)
  }, [projects, projectId])

  async function handleDownload() {
    if (!project) return
    generateProjectPDF({ project, payments, expenses, financials })
    await logReport({ reportType: 'project', projectId: project.id })
  }

  if (projectsLoading) return <LoadingSpinner />
  if (projects.length === 0) {
    return <EmptyState icon="📁" title="No projects yet" description="Create a project to see its report here." />
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-base font-medium text-slate-200">Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-xl border border-surface-border bg-slate-950 px-4 py-3 text-base text-slate-100 outline-none focus:border-brand-500"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.project_name} — {p.customer_name}
            </option>
          ))}
        </select>
      </div>

      {loading || !financials ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm text-slate-400">Total Amount</p>
              <p className="mt-1 text-lg font-bold text-slate-100">{formatCurrency(financials.totalAmount)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-400">Received</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">{formatCurrency(financials.receivedAmount)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-400">Pending</p>
              <p className="mt-1 text-lg font-bold text-amber-400">{formatCurrency(financials.pendingAmount)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-400">Total Expense</p>
              <p className="mt-1 text-lg font-bold text-rose-400">{formatCurrency(financials.totalExpense)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-400">Profit</p>
              <p className="mt-1 text-lg font-bold text-brand-400">{formatCurrency(financials.profit)}</p>
            </Card>
          </div>
          <Button variant="secondary" className="w-full" onClick={handleDownload}>
            ⬇️ Download PDF
          </Button>
        </>
      )}
    </div>
  )
                  }
