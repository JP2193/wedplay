import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import CreateEventModal from './CreateEventModal'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('admin_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!error) setEvents(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💍</span>
            <h1 className="font-semibold text-gray-800">Bingo Humano</h1>
          </div>
          <button onClick={handleLogout} className="btn-ghost text-sm">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Mis eventos</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-4 text-sm">
            + Crear evento
          </button>
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-8 text-sm">Cargando...</div>
        )}

        {!loading && events.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-gray-500 text-sm">Aún no tenés eventos creados.</p>
            <p className="text-gray-400 text-xs mt-1">Creá tu primer evento para comenzar.</p>
          </div>
        )}

        {events.map(event => (
          <div
            key={event.id}
            onClick={() => navigate(`/admin/events/${event.id}`)}
            className="card cursor-pointer hover:border-rose-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{event.name}</h3>
                <p className="text-gray-400 text-xs mt-1">
                  Código: <span className="font-mono font-medium text-gray-600">{event.code}</span>
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {event.questions_per_player} preguntas por jugador
                </p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </div>
          </div>
        ))}
      </main>

      {showModal && (
        <CreateEventModal
          adminId={session.user.id}
          onClose={() => setShowModal(false)}
          onCreated={(newEvent) => {
            setEvents(prev => [newEvent, ...prev])
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
