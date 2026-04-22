import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../pages/AdminPage'
import QuizCreateModal from '../quiz/admin/QuizCreateModal'

export default function QuizAdminSection() {
  const navigate = useNavigate()
  const { session, room } = useAdmin()
  const [event, setEvent] = useState(undefined)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!room) return
    supabase
      .from('quiz_events')
      .select('*')
      .eq('room_id', room.id)
      .eq('admin_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          navigate(`/admin/quiz/events/${data.id}`, { replace: true })
        } else {
          setEvent(null)
        }
      })
  }, [room?.id])

  async function handleCreated(newEvent) {
    await supabase.from('quiz_events').update({ room_id: room.id }).eq('id', newEvent.id)
    navigate(`/admin/quiz/events/${newEvent.id}`, { replace: true })
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
        <img src="/img/quiz.png" alt="Quiz" className="w-20 h-20 object-contain mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz</h1>
          <p className="text-gray-500 text-sm">Todavía no configuraste el Quiz para este evento.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary w-full"
        >
          Crear Quiz
        </button>
        <button onClick={() => navigate('/admin')} className="btn-ghost w-full text-sm">
          ← Volver al panel
        </button>
      </div>

      {showCreate && (
        <QuizCreateModal
          adminId={session.user.id}
          eventName={room?.event_name}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
