import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, ErrorMessage } from '../components/ui'
import { ProjectForm } from '../components/project-widgets'
import { createProject } from '../lib/supabaseClient'

export default function NewProject() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(form) {
    setSubmitting(true)
    setError('')
    try {
      const project = await createProject(form)
      navigate(`/projects/${project.id}`)
    } catch (err) {
      setError(err.message || 'Could not save this project. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-slate-50">New Project</h1>
      <ErrorMessage message={error} />
      <Card>
        <ProjectForm onSubmit={handleSubmit} submitting={submitting} />
      </Card>
    </div>
  )
}
