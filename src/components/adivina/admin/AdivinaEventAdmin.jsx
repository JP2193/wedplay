import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import AdivinaQuestionManager from './AdivinaQuestionManager'
import AdivinaLobby from './AdivinaLobby'
import AdivinaLiveQuestion from './AdivinaLiveQuestion'
import AdivinaLiveRanking from './AdivinaLiveRanking'
import QuizRankingTable from '../../quiz/shared/QuizRankingTable'

export default function AdivinaEventAdmin({ session }) {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [adivinaEvent, setAdivinaEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('setup')

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel(`adivina-event-admin-${eventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'adivina_events', filter: `id=eq.${eventId}` },
        payload => {
          setAdivinaEvent(payload.new)
          if (payload.new.status === 'finished') {
            supabase.from('adivina_players').select('id, full_name, total_score')
              .eq('adivina_event_id', eventId).order('total_score', { ascending: false })
              .then(({ data }) => { if (data) setPlayers(data) })
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [eventId])

  // Re-fetch preguntas si al pasar a 'question' el array está vacío
  useEffect(() => {
    if (!adivinaEvent || adivinaEvent.status !== 'question' || questions.length > 0) return
    supabase.from('adivina_questions').select('*').eq('adivina_event_id', eventId).order('position')
      .then(({ data }) => { if (data) setQuestions(data) })
  }, [adivinaEvent?.status])

  async function handleReset() {
    if (!window.confirm('¿Reiniciar el juego? Se borrarán todas las respuestas y puntajes de los jugadores.')) return
    const { error } = await supabase.rpc('reset_adivina_event', { p_adivina_event_id: eventId })
    if (error) { alert('Error al reiniciar: ' + error.message); return }
    setTab('lobby')
    await fetchAll()
  }

  async function fetchAll() {
    const [evRes, qRes, pRes] = await Promise.all([
      supabase.from('adivina_events').select('*').eq('id', eventId).eq('admin_id', session.user.id).single(),
      supabase.from('adivina_questions').select('*').eq('adivina_event_id', eventId).order('position'),
      supabase.from('adivina_players').select('id, full_name, total_score').eq('adivina_event_id', eventId),
    ])
    if (evRes.error || !evRes.data) { navigate('/admin/adivina'); return }
    setAdivinaEvent(evRes.data)
    if (qRes.data) setQuestions(qRes.data)
    if (pRes.data) setPlayers(pRes.data)
    setLoading(false)
  }

  if (loading || !adivinaEvent) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400 text-sm">Cargando...</div></div>
  }

  const currentQuestion = questions[adivinaEvent.current_question_index]
  const isLive = ['question', 'ranking', 'finished'].includes(adivinaEvent.status)

  async function handleTimerChange(newSeconds) {
    const val = Math.min(60, Math.max(5, Number(newSeconds)))
    if (isNaN(val) || val === adivinaEvent.timer_seconds) return
    const { data } = await supabase.from('adivina_events').update({ timer_seconds: val }).eq('id', eventId).select().single()
    if (data) setAdivinaEvent(data)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-1">
          <button onClick={() => navigate('/admin')} className="text-rose-400 text-sm hover:text-rose-500 flex items-center gap-1">← Panel</button>
          <h1 className="font-semibold text-gray-800 text-lg">{adivinaEvent.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
            <span>Código: <span className="font-mono font-semibold text-gray-700">{adivinaEvent.code}</span></span>
            {!isLive ? (
              <span className="flex items-center gap-1">
                <input
                  type="number"
                  min={5} max={60}
                  defaultValue={adivinaEvent.timer_seconds}
                  onBlur={e => handleTimerChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTimerChange(e.target.value)}
                  className="w-12 text-center border border-gray-200 rounded-lg text-sm text-gray-700 py-0.5 focus:outline-none focus:border-rose-300"
                />
                <span>s por pregunta</span>
              </span>
            ) : (
              <span>{adivinaEvent.timer_seconds}s por pregunta</span>
            )}
            <span>{questions.length} preguntas</span>
            <span className="text-gray-300">|</span>
            <span>{adivinaEvent.person1_name} vs {adivinaEvent.person2_name}</span>
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
        {adivinaEvent.status === 'lobby' && tab === 'setup' && (
          <AdivinaQuestionManager
            adivinaEventId={eventId}
            person1Name={adivinaEvent.person1_name}
            person2Name={adivinaEvent.person2_name}
            onQuestionsChange={setQuestions}
          />
        )}

        {adivinaEvent.status === 'lobby' && tab === 'lobby' && (
          <AdivinaLobby
            adivinaEvent={adivinaEvent}
            onStart={() => setTab('live')}
          />
        )}

        {adivinaEvent.status === 'question' && currentQuestion && (
          <AdivinaLiveQuestion
            adivinaEvent={adivinaEvent}
            question={currentQuestion}
            totalPlayers={players.length}
            onTimeUp={() => {}}
          />
        )}

        {adivinaEvent.status === 'ranking' && (
          <AdivinaLiveRanking
            adivinaEvent={adivinaEvent}
            totalQuestions={questions.length}
            onNext={() => {}}
            onFinish={() => {}}
          />
        )}

        {adivinaEvent.status === 'finished' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">🏁 Ranking final</h3>
              <button onClick={handleReset} className="btn-secondary text-sm py-2 px-4">
                ↺ Reiniciar juego
              </button>
            </div>
            <QuizRankingTable players={players} />
          </div>
        )}
      </main>
    </div>
  )
}
