import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLogin from '../components/admin/AdminLogin'
import { getOrCreateRoom } from '../lib/rooms'

export const AdminContext = createContext(null)
export function useAdmin() { return useContext(AdminContext) }

export default function AdminPage() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [room, setRoom] = useState(undefined)
  const loadingRoomRef = useRef(false)
  const lastUserIdRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session) { setRoom(null); lastUserIdRef.current = null; return }

    if (loadingRoomRef.current) return
    if (lastUserIdRef.current === session.user.id && room !== undefined) return

    loadingRoomRef.current = true
    lastUserIdRef.current = session.user.id

    getOrCreateRoom(session.user.id)
      .then(setRoom)
      .catch(err => { console.error('Error loading room:', err); setRoom(null) })
      .finally(() => { loadingRoomRef.current = false })
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
    return <AdminLogin redirectPath="/admin" />
  }

  return (
    <AdminContext.Provider value={{ session, room, refreshRoom }}>
      <Outlet />
    </AdminContext.Provider>
  )
}
