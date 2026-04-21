import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import QuizQuestionManager from './QuizQuestionManager'
import QuizLobby from './QuizLobby'
import QuizLiveQuestion from './QuizLiveQuestion'
import QuizLiveRanking from './QuizLiveRanking'
import QuizRankingTable from '../shared/QuizRankingTable'

export default function QuizEventAdmin({ session }) {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [quizEvent, setQuizEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('setup')

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel(`quiz-event-admin-${eventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_events', filter: `id=eq.${eventId}` },
        payload => {
          setQuizEvent(payload.new)
          if (payload.new.status === 'finished') {
            supabase.from('quiz_players').select('id, full_name, total_score')
              .eq('quiz_event_id', eventId).order('total_score', { ascending: false })
              .then(({ data }) => { if (data) setPlayers(data) })
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [eventId])

  // Re-fetch preguntas si al pasar a 'question' el array está vacío
  useEffect(() => {
    if (!quizEvent || quizEvent.status !== 'question' || questions.length > 0) return
    supabase.from('quiz_questions').select('*').eq('quiz_event_id', eventId).order('position')
      .then(({ data }) => { if (data) setQuestions(data) })
  }, [quizEvent?.status])


  async function handleReset() {
    if (!window.confirm('¿Reiniciar el quiz? Se borrarán todas las respuestas y puntajes de los jugadores.')) return
    const { error } = await supabase.rpc('reset_quiz_event', { p_quiz_event_id: eventId })
    if (error) { alert('Error al reiniciar: ' + error.message); return }
    await fetchAll()
  }

  async function fetchAll() {
    const [evRes, qRes, pRes] = await Promise.all([
      supabase.from('quiz_events').select('*').eq('id', eventId).eq('admin_id', session.user.id).single(),
      supabase.from('quiz_questions').select('*').eq('quiz_event_id', eventId).order('position'),
      supabase.from('quiz_players').select('id, full_name, total_score').eq('quiz_event_id', eventId),
    ])
    if (evRes.error || !evRes.data) { navigate('/quiz/admin'); return }
    setQuizEvent(evRes.data)
    if (qRes.data) setQuestions(qRes.data)
    if (pRes.data) setPlayers(pRes.data)
    setLoading(false)
  }

  if (loading || !quizEvent) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400 text-sm">Cargando...</div></div>
  }

  const currentQuestion = questions[quizEvent.current_question_index]
  const isLive = ['question', 'ranking', 'finished'].includes(quizEvent.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-1">
          <button onClick={() => navigate('/quiz/admin')} className="text-rose-400 text-sm hover:text-rose-500 flex items-center gap-1">← Volver</button>
          <h1 className="font-semibold text-gray-800 text-lg">{quizEvent.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Código: <span className="font-mono font-semibold text-gray-700">{quizEvent.code}</span></span>
            <span>{quizEvent.timer_seconds}s por pregunta</span>
            <span>{questions.length} preguntas</span>
          </div>
        </div>
      </header>

      {/* Tabs — solo si no está en vivo */}
      {!isLive && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex border-b border-gray-200 mt-4 gap-6">
            {['setup', 'lobby'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-rose-400 text-rose-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {t === 'setup' ? 'Preguntas' : 'Sala de espera'}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* SETUP */}
        {quizEvent.status === 'lobby' && tab === 'setup' && (
          <QuizQuestionManager quizEventId={eventId} onQuestionsChange={setQuestions} />
        )}

        {/* LOBBY */}
        {quizEvent.status === 'lobby' && tab === 'lobby' && (
          <QuizLobby
            quizEvent={quizEvent}
            onStart={() => setTab('live')}
          />
        )}

        {/* PREGUNTA EN VIVO */}
        {quizEvent.status === 'question' && currentQuestion && (
          <QuizLiveQuestion
            quizEvent={quizEvent}
            question={currentQuestion}
            totalPlayers={players.length}
            onTimeUp={() => {}}
          />
        )}

        {/* RANKING */}
        {quizEvent.status === 'ranking' && (
          <QuizLiveRanking
            quizEvent={quizEvent}
            totalQuestions={questions.length}
            onNext={() => {}}
            onFinish={() => {}}
          />
        )}

        {/* FINALIZADO */}
        {quizEvent.status === 'finished' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">🏁 Ranking final</h3>
              <button onClick={handleReset} className="btn-secondary text-sm py-2 px-4">
                ↺ Reiniciar quiz
              </button>
            </div>
            <QuizRankingTable players={players} />
          </div>
        )}
      </main>
    </div>
  )
}
