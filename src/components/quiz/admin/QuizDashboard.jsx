import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import QuizCreateModal from './QuizCreateModal'

const STATUS_LABEL = { lobby: 'En espera', question: 'En curso', ranking: 'En curso', finished: 'Finalizado' }
const STATUS_COLOR = { lobby: 'bg-gray-100 text-gray-500', question: 'bg-green-100 text-green-600', ranking: 'bg-green-100 text-green-600', finished: 'bg-blue-100 text-blue-500' }

export default function QuizDashboard({ session }) {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    const { data } = await supabase
      .from('quiz_events')
      .select('*')
      .eq('admin_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar este quiz? Se borrarán todas sus preguntas y jugadores.')) return
    setDeletingId(id)
    await supabase.from('quiz_events').delete().eq('id', id)
    setEvents(prev => prev.filter(ev => ev.id !== id))
    setDeletingId(null)
  }

  async function handleLogout() { await supabase.auth.signOut() }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">❓</span>
            <h1 className="font-semibold text-gray-800">Quiz</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="btn-ghost text-sm">← WedPlay</button>
            <button onClick={handleLogout} className="btn-ghost text-sm">Salir</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Mis quizzes</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-4 text-sm">+ Nuevo quiz</button>
        </div>

        {loading && <div className="text-center text-gray-400 py-8 text-sm">Cargando...</div>}

        {!loading && events.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-gray-500 text-sm">Aún no tenés quizzes creados.</p>
          </div>
        )}

        {events.map(ev => (
          <div
            key={ev.id}
            onClick={() => navigate(`/quiz/admin/events/${ev.id}`)}
            className="card cursor-pointer hover:border-rose-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 truncate">{ev.name}</h3>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[ev.status]}`}>
                    {STATUS_LABEL[ev.status]}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Código: <span className="font-mono font-medium text-gray-600">{ev.code}</span>
                  <span className="ml-3">{ev.timer_seconds}s por pregunta</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => handleDelete(e, ev.id)}
                  disabled={deletingId === ev.id}
                  className="text-gray-200 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
                >
                  {deletingId === ev.id ? <span className="text-xs text-gray-300">...</span> : (
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
        <QuizCreateModal
          adminId={session.user.id}
          onClose={() => setShowModal(false)}
          onCreated={ev => { setEvents(prev => [ev, ...prev]); setShowModal(false) }}
        />
      )}
    </div>
  )
}
