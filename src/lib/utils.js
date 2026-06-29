import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* ---------------------------- Constants ---------------------------- */

export const EXPENSE_CATEGORIES = [
  { value: 'labour', label: 'Labour', icon: '👷' },
  { value: 'material', label: 'Material', icon: '🧱' },
  { value: 'transport', label: 'Transport', icon: '🚚' },
  { value: 'other', label: 'Other', icon: '📦' }
]

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/* ---------------------------- Formatting ---------------------------- */

export function formatCurrency(amount) {
  const value = Number(amount)
  const safe = Number.isNaN(value) ? 0 : value
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(safe)
}

export function todayISO() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().split('T')[0]
}

export function formatDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ---------------------------- Calculations ---------------------------- */

export function computeProjectFinancials(project, payments = [], expenses = []) {
  const totalAmount = Number(project?.deal_amount) || 0
  const receivedAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const pendingAmount = Math.max(0, totalAmount - receivedAmount)
  const profit = receivedAmount - totalExpense
  return { totalAmount, receivedAmount, pendingAmount, totalExpense, profit }
}

/* ---------------------------- PDF generation ---------------------------- */

function newDoc(title) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setFontSize(18)
  doc.setTextColor(20, 40, 90)
  doc.text('Site Ledger', 40, 40)
  doc.setFontSize(11)
  doc.setTextColor(90, 90, 90)
  doc.text(title, 40, 58)
  doc.setDrawColor(220, 220, 220)
  doc.line(40, 66, 555, 66)
  return doc
}

function addSummaryLine(doc, y, label, value) {
  doc.setFontSize(11)
  doc.setTextColor(40, 40, 40)
  doc.text(`${label}:`, 40, y)
  doc.setFont(undefined, 'bold')
  doc.text(String(value), 180, y)
  doc.setFont(undefined, 'normal')
  return y + 18
}

export function generateProjectPDF({ project, payments, expenses, financials }) {
  const doc = newDoc(`Project Report — ${project.project_name}`)
  let y = 90

  y = addSummaryLine(doc, y, 'Customer', project.customer_name)
  y = addSummaryLine(doc, y, 'Phone', project.phone || '—')
  y = addSummaryLine(doc, y, 'Start Date', formatDate(project.start_date))
  y = addSummaryLine(doc, y, 'Status', project.status === 'completed' ? 'Completed' : 'Active')
  y += 6
  y = addSummaryLine(doc, y, 'Total Amount', formatCurrency(financials.totalAmount))
  y = addSummaryLine(doc, y, 'Received Amount', formatCurrency(financials.receivedAmount))
  y = addSummaryLine(doc, y, 'Pending Amount', formatCurrency(financials.pendingAmount))
  y = addSummaryLine(doc, y, 'Total Expense', formatCurrency(financials.totalExpense))
  y = addSummaryLine(doc, y, 'Profit', formatCurrency(financials.profit))
  y += 10

  doc.setFontSize(13)
  doc.setTextColor(20, 40, 90)
  doc.text('Payments', 40, y)
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Amount', 'Note']],
    body: payments.map((p) => [formatDate(p.payment_date), formatCurrency(p.amount), p.note || '—']),
    headStyles: { fillColor: [29, 78, 216] },
    styles: { fontSize: 10 },
    margin: { left: 40, right: 40 }
  })

  let nextY = doc.lastAutoTable.finalY + 24

  doc.setFontSize(13)
  doc.setTextColor(20, 40, 90)
  doc.text('Expenses', 40, nextY)
  nextY += 6

  autoTable(doc, {
    startY: nextY,
    head: [['Date', 'Category', 'Amount', 'Note']],
    body: expenses.map((e) => [formatDate(e.expense_date), e.category, formatCurrency(e.amount), e.note || '—']),
    headStyles: { fillColor: [29, 78, 216] },
    styles: { fontSize: 10 },
    margin: { left: 40, right: 40 }
  })

  doc.save(`${project.project_name.replace(/\s+/g, '_')}_report.pdf`)
}

export function generatePeriodPDF({ title, fileName, payments, expenses, totalIncome, totalExpense }) {
  const doc = newDoc(title)
  let y = 90

  y = addSummaryLine(doc, y, 'Total Income', formatCurrency(totalIncome))
  y = addSummaryLine(doc, y, 'Total Expense', formatCurrency(totalExpense))
  y = addSummaryLine(doc, y, 'Net', formatCurrency(totalIncome - totalExpense))
  y += 10

  doc.setFontSize(13)
  doc.setTextColor(20, 40, 90)
  doc.text('Payments', 40, y)
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Project', 'Amount', 'Note']],
    body: payments.map((p) => [
      formatDate(p.payment_date),
      p.projects?.project_name || '—',
      formatCurrency(p.amount),
      p.note || '—'
    ]),
    headStyles: { fillColor: [29, 78, 216] },
    styles: { fontSize: 10 },
    margin: { left: 40, right: 40 }
  })

  let nextY = doc.lastAutoTable.finalY + 24

  doc.setFontSize(13)
  doc.setTextColor(20, 40, 90)
  doc.text('Expenses', 40, nextY)
  nextY += 6

  autoTable(doc, {
    startY: nextY,
    head: [['Date', 'Project', 'Category', 'Amount', 'Note']],
    body: expenses.map((e) => [
      formatDate(e.expense_date),
      e.projects?.project_name || '—',
      e.category,
      formatCurrency(e.amount),
      e.note || '—'
    ]),
    headStyles: { fillColor: [29, 78, 216] },
    styles: { fontSize: 10 },
    margin: { left: 40, right: 40 }
  })

  doc.save(fileName)
}
