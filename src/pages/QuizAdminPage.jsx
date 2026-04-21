import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLogin from '../components/admin/AdminLogin'
import QuizDashboard from '../components/quiz/admin/QuizDashboard'
import QuizEventAdmin from '../components/quiz/admin/QuizEventAdmin'

export default function QuizAdminPage() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  if (!session) return <AdminLogin redirectPath="/quiz/admin" title="Quiz" emoji="❓" />

  return (
    <Routes>
      <Route path="/" element={<QuizDashboard session={session} />} />
      <Route path="/events/:eventId" element={<QuizEventAdmin session={session} />} />
      <Route path="*" element={<Navigate to="/quiz/admin" replace />} />
    </Routes>
  )
}
