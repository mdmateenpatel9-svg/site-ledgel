import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

/* ---------------------------- Projects ---------------------------- */

export async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getProject(projectId) {
  const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single()
  if (error) throw error
  return data
}

export async function createProject(input) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData?.user) throw new Error('You must be signed in to create a project.')

  const payload = {
    user_id: userData.user.id,
    customer_name: input.customerName.trim(),
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    project_name: input.projectName.trim(),
    deal_amount: Number(input.dealAmount) || 0,
    start_date: input.startDate,
    notes: input.notes?.trim() || null,
    status: 'active'
  }

  const { data, error } = await supabase.from('projects').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateProjectStatus(projectId, status) {
  const { data, error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)
    .select()
    .single()
  if (error) throw error
  return data
}

/* ---------------------------- Payments ---------------------------- */

export async function listPaymentsForProject(projectId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('payment_date', { ascending: false })
  if (error) throw error
  return data
}

export async function listAllPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('*, projects(project_name, customer_name)')
    .order('payment_date', { ascending: false })
  if (error) throw error
  return data
}

export async function addPayment(projectId, input) {
  const payload = {
    project_id: projectId,
    amount: Number(input.amount) || 0,
    payment_date: input.date,
    note: input.note?.trim() || null
  }
  const { data, error } = await supabase.from('payments').insert(payload).select().single()
  if (error) throw error
  return data
}

/* ---------------------------- Expenses ---------------------------- */

export async function listExpensesForProject(projectId) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('project_id', projectId)
    .order('expense_date', { ascending: false })
  if (error) throw error
  return data
}

export async function listAllExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, projects(project_name, customer_name)')
    .order('expense_date', { ascending: false })
  if (error) throw error
  return data
}

export async function addExpense(projectId, input) {
  const payload = {
    project_id: projectId,
    category: input.category,
    amount: Number(input.amount) || 0,
    expense_date: input.date,
    note: input.note?.trim() || null
  }
  const { data, error } = await supabase.from('expenses').insert(payload).select().single()
  if (error) throw error
  return data
}

/* ---------------------------- Reports / Dashboard ---------------------------- */

export async function getDashboardStats() {
  const [projects, payments, expenses] = await Promise.all([
    listProjects(),
    listAllPayments(),
    listAllExpenses()
  ])

  const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalProfit = totalIncome - totalExpenses

  const receivedByProject = {}
  for (const p of payments) {
    receivedByProject[p.project_id] = (receivedByProject[p.project_id] || 0) + Number(p.amount)
  }

  const pendingPayment = projects.reduce((sum, project) => {
    const received = receivedByProject[project.id] || 0
    const pending = Number(project.deal_amount) - received
    return sum + Math.max(0, pending)
  }, 0)

  return {
    totalProjects: projects.length,
    totalIncome,
    totalExpenses,
    totalProfit,
    pendingPayment
  }
}

export async function getDailyReportData(isoDate) {
  const [payments, expenses] = await Promise.all([listAllPayments(), listAllExpenses()])
  const dayPayments = payments.filter((p) => p.payment_date === isoDate)
  const dayExpenses = expenses.filter((e) => e.expense_date === isoDate)
  return {
    payments: dayPayments,
    expenses: dayExpenses,
    totalIncome: dayPayments.reduce((s, p) => s + Number(p.amount), 0),
    totalExpense: dayExpenses.reduce((s, e) => s + Number(e.amount), 0)
  }
}

export async function getMonthlyReportData(year, month) {
  const [payments, expenses] = await Promise.all([listAllPayments(), listAllExpenses()])
  const inMonth = (dateStr) => {
    const d = new Date(dateStr)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  }
  const monthPayments = payments.filter((p) => inMonth(p.payment_date))
  const monthExpenses = expenses.filter((e) => inMonth(e.expense_date))
  return {
    payments: monthPayments,
    expenses: monthExpenses,
    totalIncome: monthPayments.reduce((s, p) => s + Number(p.amount), 0),
    totalExpense: monthExpenses.reduce((s, e) => s + Number(e.amount), 0)
  }
}

export async function logReport({ reportType, reportPeriod = null, projectId = null }) {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return null
  const { error } = await supabase.from('reports').insert({
    user_id: userData.user.id,
    report_type: reportType,
    report_period: reportPeriod,
    project_id: projectId
  })
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('Could not log report generation:', error.message)
  }
    }
