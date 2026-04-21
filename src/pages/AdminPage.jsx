import { createContext, useContext, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLogin from '../components/admin/AdminLogin'
import RoomDashboard from '../components/admin/RoomDashboard'
import BingoAdminSection from '../components/admin/BingoAdminSection'
import QuizAdminSection from '../components/admin/QuizAdminSection'
import AdivinaAdminSection from '../components/admin/AdivinaAdminSection'
import DeseosAdminSection from '../components/admin/DeseosAdminSection'
import TimelineAdminSection from '../components/admin/TimelineAdminSection'
import EventDetail from '../components/admin/EventDetail'
import QuizEventAdmin from '../components/quiz/admin/QuizEventAdmin'
import AdivinaEventAdmin from '../components/adivina/admin/AdivinaEventAdmin'
import { getOrCreateRoom } from '../lib/rooms'

export const AdminContext = createContext(null)
export function useAdmin() { return useContext(AdminContext) }

export default function AdminPage() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [room, setRoom] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session) { setRoom(null); return }
    getOrCreateRoom(session.user.id).then(setRoom).catch(err => {
      console.error('Error loading room:', err)
      setRoom(null)
    })
  }, [session])

  async function refreshRoom() {
    if (!session) return
    const updated = await getOrCreateRoom(session.user.id)
    setRoom(updated)
  }

  if (session === undefined || (session && room === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return <AdminLogin redirectPath="/admin" title="WedPlay Admin" emoji="💍" />
  }

  return (
    <AdminContext.Provider value={{ session, room, refreshRoom }}>
      <Routes>
        <Route path="/" element={<RoomDashboard />} />
        <Route path="bingo" element={<BingoAdminSection />} />
        <Route path="bingo/events/:eventId" element={<EventDetail session={session} />} />
        <Route path="quiz" element={<QuizAdminSection />} />
        <Route path="quiz/events/:eventId" element={<QuizEventAdmin session={session} />} />
        <Route path="adivina" element={<AdivinaAdminSection />} />
        <Route path="adivina/events/:eventId" element={<AdivinaEventAdmin session={session} />} />
        <Route path="deseos" element={<DeseosAdminSection />} />
        <Route path="timeline" element={<TimelineAdminSection />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminContext.Provider>
  )
}
