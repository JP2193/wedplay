import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAdmin } from '../../../pages/AdminPage'
import QuizQuestionManager from './QuizQuestionManager'
import QuizLobby from './QuizLobby'
import QuizLiveQuestion from './QuizLiveQuestion'
import QuizLiveRanking from './QuizLiveRanking'
import QuizRankingTable from '../shared/QuizRankingTable'

/* ─── ConfigModal ──────────────────────────────────────────── */
function ConfigModal({ quizEvent, onClose, onSaved }) {
  const [timer, setTimer] = useState(quizEvent.timer_seconds)
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const val = Math.min(60, Math.max(5, Number(timer)))
    await supabase.from('quiz_events').update({ timer_seconds: val }).eq('id', quizEvent.id)
    await onSaved()
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Configuración del Quiz</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segundos por pregunta</label>
            <input
              type="number"
              className="input-field"
              min={5} max={60}
              value={timer}
              onChange={e => setTimer(Number(e.target.value))}
              required autoFocus
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── DeleteModal ──────────────────────────────────────────── */
function DeleteModal({ eventId, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('quiz_events').delete().eq('id', eventId)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">¿Eliminar el quiz?</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Se eliminarán todas las preguntas y los datos de los jugadores. Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} disabled={deleting} className="btn-secondary flex-1">Cancelar</button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl py-2.5 transition-colors disabled:opacity-60"
          >
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── StopGameModal ────────────────────────────────────────── */
function StopGameModal({ onClose, onConfirm, stopping }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">¿Detener el juego?</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          El juego está en curso. Si salís ahora se reiniciará y se perderán los puntajes de esta partida.
        </p>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} disabled={stopping} className="btn-secondary flex-1">Cancelar</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={stopping}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl py-2.5 transition-colors disabled:opacity-60"
          >
            {stopping ? 'Deteniendo...' : 'Detener y salir'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── OptionsMenu ──────────────────────────────────────────── */
function OptionsMenu({ onConfig, onDelete, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors disabled:opacity-40"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
        </svg>
        Opciones
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
          <button
            type="button"
            onClick={() => { setOpen(false); onConfig() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cambiar configuración
          </button>
          <div className="border-t border-gray-100" />
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar quiz
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── QuizEventAdmin ───────────────────────────────────────── */
export default function QuizEventAdmin() {
  const { session, room } = useAdmin()
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [quizEvent, setQuizEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('setup')
  const [showConfig, setShowConfig] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showStopGame, setShowStopGame] = useState(false)
  const [stopping, setStopping] = useState(false)

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

  useEffect(() => {
    if (!quizEvent || quizEvent.status !== 'question' || questions.length > 0) return
    supabase.from('quiz_questions').select('*').eq('quiz_event_id', eventId).order('position')
      .then(({ data }) => { if (data) setQuestions(data) })
  }, [quizEvent?.status])

  async function handleStopAndExit() {
    setStopping(true)
    await supabase.rpc('reset_quiz_event', { p_quiz_event_id: eventId })
    navigate('/admin')
  }

  async function handleReset() {
    if (!window.confirm('¿Reiniciar el quiz? Se borrarán todas las respuestas y puntajes de los jugadores.')) return
    const { error } = await supabase.rpc('reset_quiz_event', { p_quiz_event_id: eventId })
    if (error) { alert('Error al reiniciar: ' + error.message); return }
    setTab('setup')
    await fetchAll()
  }

  async function fetchAll() {
    const [evRes, qRes, pRes] = await Promise.all([
      supabase.from('quiz_events').select('*').eq('id', eventId).eq('admin_id', session.user.id).single(),
      supabase.from('quiz_questions').select('*').eq('quiz_event_id', eventId).order('position'),
      supabase.from('quiz_players').select('id, full_name, total_score').eq('quiz_event_id', eventId),
    ])
    if (evRes.error || !evRes.data) { navigate('/admin/quiz'); return }
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
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => isLive ? setShowStopGame(true) : navigate('/admin')}
              className="text-rose-400 text-sm hover:text-rose-500 flex items-center gap-1"
            >← Panel</button>
            <OptionsMenu
              onConfig={() => setShowConfig(true)}
              onDelete={() => setShowDelete(true)}
              disabled={isLive}
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <img src="/img/quiz.png" alt="Quiz" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="font-semibold text-gray-800 text-lg leading-tight">Quiz</h1>
              <p className="text-xs text-gray-400">
                {quizEvent.timer_seconds}s por pregunta · {questions.length} preguntas
              </p>
            </div>
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
        {quizEvent.status === 'lobby' && tab === 'setup' && (
          <QuizQuestionManager quizEventId={eventId} onQuestionsChange={setQuestions} />
        )}

        {quizEvent.status === 'lobby' && tab === 'lobby' && (
          <QuizLobby quizEvent={quizEvent} room={room} onStart={() => setTab('live')} />
        )}

        {quizEvent.status === 'question' && currentQuestion && (
          <QuizLiveQuestion
            quizEvent={quizEvent}
            question={currentQuestion}
            totalPlayers={players.length}
            onTimeUp={() => {}}
          />
        )}

        {quizEvent.status === 'ranking' && (
          <QuizLiveRanking
            quizEvent={quizEvent}
            totalQuestions={questions.length}
            onNext={() => {}}
            onFinish={() => {}}
          />
        )}

        {quizEvent.status === 'finished' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">🏁 Ranking final</h3>
              <button onClick={handleReset} className="btn-secondary text-sm py-2 px-4">↺ Reiniciar quiz</button>
            </div>
            <QuizRankingTable players={players} />
          </div>
        )}
      </main>

      {showConfig && (
        <ConfigModal
          quizEvent={quizEvent}
          onClose={() => setShowConfig(false)}
          onSaved={fetchAll}
        />
      )}

      {showDelete && (
        <DeleteModal
          eventId={eventId}
          onClose={() => setShowDelete(false)}
          onDeleted={() => navigate('/admin/quiz', { replace: true })}
        />
      )}

      {showStopGame && (
        <StopGameModal
          onClose={() => setShowStopGame(false)}
          onConfirm={handleStopAndExit}
          stopping={stopping}
        />
      )}
    </div>
  )
}
