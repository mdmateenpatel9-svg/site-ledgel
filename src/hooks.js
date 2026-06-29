import { useContext, useCallback, useEffect, useState } from 'react'
import { AuthContext } from './context/AuthContext'
import { listProjects, getProject, listPaymentsForProject, listExpensesForProject } from './lib/supabaseClient'
import { computeProjectFinancials } from './lib/utils'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listProjects()
      setProjects(data)
    } catch (err) {
      setError(err.message || 'Could not load projects.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { projects, loading, error, refresh }
}

export function useProject(projectId) {
  const [project, setProject] = useState(null)
  const [payments, setPayments] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [projectData, paymentsData, expensesData] = await Promise.all([
        getProject(projectId),
        listPaymentsForProject(projectId),
        listExpensesForProject(projectId)
      ])
      setProject(projectData)
      setPayments(paymentsData)
      setExpenses(expensesData)
    } catch (err) {
      setError(err.message || 'Could not load this project.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const financials = project ? computeProjectFinancials(project, payments, expenses) : null

  return { project, payments, expenses, financials, loading, error, refresh, setProject }
  }
