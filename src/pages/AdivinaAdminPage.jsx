import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLogin from '../components/admin/AdminLogin'
import AdivinaDashboard from '../components/adivina/admin/AdivinaDashboard'
import AdivinaEventAdmin from '../components/adivina/admin/AdivinaEventAdmin'

export default function AdivinaAdminPage() {
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

  if (!session) return <AdminLogin redirectPath="/adivina/admin" title="Adivina Quién" emoji="💍" />

  return (
    <Routes>
      <Route path="/" element={<AdivinaDashboard session={session} />} />
      <Route path="/events/:eventId" element={<AdivinaEventAdmin session={session} />} />
      <Route path="*" element={<Navigate to="/adivina/admin" replace />} />
    </Routes>
  )
}
