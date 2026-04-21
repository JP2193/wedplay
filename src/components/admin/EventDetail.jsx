import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import QuestionList from './QuestionList'
import FinishedPlayers from './FinishedPlayers'

export default function EventDetail({ session }) {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('questions') // 'questions' | 'finished'

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  async function fetchEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('admin_id', session.user.id)
      .single()

    if (error || !data) {
      navigate('/bingo/admin')
      return
    }
    setEvent(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-1">
          <button
            onClick={() => navigate('/bingo/admin')}
            className="text-rose-400 text-sm hover:text-rose-500 flex items-center gap-1"
          >
            ← Volver
          </button>
          <h1 className="font-semibold text-gray-800 text-lg">{event.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Código: <span className="font-mono font-semibold text-gray-700">{event.code}</span></span>
            <span>{event.questions_per_player} preguntas/jugador</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex border-b border-gray-200 mt-4 gap-6">
          <button
            onClick={() => setTab('questions')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'questions'
                ? 'border-rose-400 text-rose-500'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Preguntas
          </button>
          <button
            onClick={() => setTab('finished')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'finished'
                ? 'border-rose-400 text-rose-500'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Finalizados
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {tab === 'questions' && <QuestionList event={event} />}
        {tab === 'finished' && <FinishedPlayers eventId={eventId} />}
      </main>
    </div>
  )
}
