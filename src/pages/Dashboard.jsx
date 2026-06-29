import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../lib/supabaseClient'
import { formatCurrency } from '../lib/utils'
import { useProjects } from '../hooks'
import { StatCard, EmptyState, LoadingSpinner, ErrorMessage, Button } from '../components/ui'
import { ProjectCard } from '../components/project-widgets'

export default function Dashboard() {
  const { projects, loading: projectsLoading, error: projectsError, refresh } = useProjects()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(null)

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError(null)
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      setStatsError(err.message || 'Could not load dashboard stats.')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  function handleRetry() {
    refresh()
    loadStats()
  }

  const loading = projectsLoading || statsLoading
  const activeProjects = projects.filter((p) => p.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">Dashboard</h1>
        <Link to="/projects/new">
          <Button size="md">➕ New Project</Button>
        </Link>
      </div>

      {(projectsError || statsError) && <ErrorMessage message={projectsError || statsError} onRetry={handleRetry} />}

      {loading && !stats ? (
        <LoadingSpinner fullScreen />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total Projects" value={stats?.totalProjects ?? 0} icon="📁" accent="brand" />
            <StatCard label="Total Income" value={formatCurrency(stats?.totalIncome ?? 0)} icon="💰" accent="green" />
            <StatCard label="Total Expenses" value={formatCurrency(stats?.totalExpenses ?? 0)} icon="🧾" accent="red" />
            <StatCard label="Total Profit" value={formatCurrency(stats?.totalProfit ?? 0)} icon="📈" accent="brand" />
            <StatCard label="Pending Payment" value={formatCurrency(stats?.pendingPayment ?? 0)} icon="⏳" accent="amber" />
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-slate-100">Active Projects ({activeProjects.length})</h2>
            {activeProjects.length === 0 ? (
              <EmptyState
                icon="📁"
                title="No active projects yet"
                description="Start by adding your first Tiles & Granite project."
                action={
                  <Link to="/projects/new">
                    <Button>➕ Add Project</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
                }
