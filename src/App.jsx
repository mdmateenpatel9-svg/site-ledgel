import { Routes, Route, Link } from 'react-router-dom'
import { Layout, ProtectedRoute, Button } from './components/ui'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewProject from './pages/NewProject.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import Reports from './pages/Reports.jsx'

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-5xl">🧱</span>
      <h1 className="text-2xl font-bold text-slate-50">Page not found</h1>
      <Link to="/">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/projects/new" element={<Protected><NewProject /></Protected>} />
      <Route path="/projects/:id" element={<Protected><ProjectDetail /></Protected>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
