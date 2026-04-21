import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import CreateEventModal from './CreateEventModal'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

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

  async function handleDelete(e, eventId) {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar este evento? Se borrarán todas sus preguntas y jugadores. Esta acción no se puede deshacer.')) return

    setDeletingId(eventId)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (!error) {
      setEvents(prev => prev.filter(ev => ev.id !== eventId))
    }
    setDeletingId(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h1 className="font-semibold text-gray-800">Bingo Humano</h1>
          </div>
          <button onClick={handleLogout} className="btn-ghost text-sm">Salir</button>
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 truncate">{event.name}</h3>
                  {event.dynamic_mode && (
                    <span className="shrink-0 text-xs bg-rose-50 text-rose-400 font-medium px-2 py-0.5 rounded-full">
                      Dinámico
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Código: <span className="font-mono font-medium text-gray-600">{event.code}</span>
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {event.dynamic_mode
                    ? `${event.easy_count} fáciles + ${event.hard_count} difíciles`
                    : `${event.questions_per_player} preguntas por jugador`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => handleDelete(e, event.id)}
                  disabled={deletingId === event.id}
                  className="text-gray-200 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
                  title="Eliminar evento"
                >
                  {deletingId === event.id ? (
                    <span className="text-xs text-gray-300">...</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
                <span className="text-gray-300 text-lg">›</span>
              </div>
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
