import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLogin from '../components/admin/AdminLogin'
import Dashboard from '../components/admin/Dashboard'
import EventDetail from '../components/admin/EventDetail'

export default function AdminPage() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="text-rose-400 text-sm">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return <AdminLogin />
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard session={session} />} />
      <Route path="/events/:eventId" element={<EventDetail session={session} />} />
      <Route path="*" element={<Navigate to="/bingo/admin" replace />} />
    </Routes>
  )
}
