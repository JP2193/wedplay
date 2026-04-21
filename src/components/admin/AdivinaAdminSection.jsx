import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../pages/AdminPage'
import AdivinaCreateModal from '../adivina/admin/AdivinaCreateModal'

export default function AdivinaAdminSection() {
  const navigate = useNavigate()
  const { session, room } = useAdmin()
  const [event, setEvent] = useState(undefined)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!room) return
    supabase
      .from('adivina_events')
      .select('*')
      .eq('room_id', room.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          navigate(`/admin/adivina/events/${data.id}`, { replace: true })
        } else {
          setEvent(null)
        }
      })
  }, [room?.id])

  async function handleCreated(newEvent) {
    await supabase.from('adivina_events').update({ room_id: room.id }).eq('id', newEvent.id)
    navigate(`/admin/adivina/events/${newEvent.id}`, { replace: true })
  }

  if (event === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-5xl">💍</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Adivina Quién</h1>
          <p className="text-gray-500 text-sm">Todavía no configuraste este juego para el evento.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary w-full"
        >
          Crear Adivina Quién
        </button>
        <button onClick={() => navigate('/admin')} className="btn-ghost w-full text-sm">
          ← Volver al panel
        </button>
      </div>

      {showCreate && (
        <AdivinaCreateModal
          adminId={session.user.id}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
