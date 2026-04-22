import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../pages/AdminPage'
import QuestionList from './QuestionList'
import FinishedPlayers from './FinishedPlayers'

export default function EventDetail() {
  const { session } = useAdmin()
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
      navigate('/admin', { replace: true })
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
            onClick={() => navigate('/admin')}
            className="text-rose-400 text-sm hover:text-rose-500 flex items-center gap-1"
          >
            ← Panel
          </button>
          <div className="flex items-center gap-3">
            <img src="/img/bingoh.png" alt="Bingo Humano" className="w-8 h-8 object-contain" />
            <h1 className="font-semibold text-gray-800 text-lg">Bingo Humano</h1>
          </div>
          <div className="text-sm text-gray-400">
            {event.questions_per_player} preguntas/jugador
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
