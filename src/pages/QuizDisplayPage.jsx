import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { supabase } from '../lib/supabase'
import { getRoomByCode } from '../lib/rooms'
import QuizRankingTable from '../components/quiz/shared/QuizRankingTable'

/* ─── DisplayTimer ──────────────────────────────────────── */
function DisplayTimer({ totalSeconds, startedAt }) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    function tick() {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
      const left = Math.min(totalSeconds, Math.max(0, totalSeconds - elapsed))
      setRemaining(left)
    }
    tick()
    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [startedAt, totalSeconds])

  const pct = remaining / totalSeconds
  const size = 180
  const radius = 78
  const circ = 2 * Math.PI * radius
  const dash = circ * pct
  const color = pct > 0.5 ? '#34d399' : pct > 0.25 ? '#fbbf24' : '#f87171'
  const secs = Math.ceil(remaining)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ffffff15" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.1s linear, stroke 0.3s' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-black tabular-nums"
        style={{ fontSize: secs >= 10 ? '3.5rem' : '4rem', color }}
      >
        {secs}
      </span>
    </div>
  )
}

const OPTION_COLORS = {
  A: 'bg-indigo-500 hover:bg-indigo-500',
  B: 'bg-amber-500 hover:bg-amber-500',
  C: 'bg-rose-500 hover:bg-rose-500',
  D: 'bg-emerald-500 hover:bg-emerald-500',
}

const OPTION_LIGHT = {
  A: 'bg-indigo-600/80',
  B: 'bg-amber-600/80',
  C: 'bg-rose-600/80',
  D: 'bg-emerald-600/80',
}

/* ─── Lobby display ─────────────────────────────────────── */
function LobbyDisplay({ room, quizEvent, players }) {
  const joinUrl = `${window.location.origin}/${room.code}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      {/* Logo + title */}
      <div className="text-center mb-10 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src="/img/quiz.png" alt="Quiz" className="w-12 h-12 object-contain" />
          <h1 className="text-4xl font-black text-white tracking-tight">Quiz</h1>
        </div>
        {quizEvent?.name && (
          <p className="text-purple-300 text-lg font-medium">{quizEvent.name}</p>
        )}
      </div>

      {/* QR + code */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <p className="text-purple-200 text-xl font-semibold tracking-wide uppercase">Escaneá para jugar</p>

        <div className="bg-white rounded-3xl p-5 shadow-2xl shadow-purple-900/50">
          <QRCode value={joinUrl} size={220} />
        </div>

        <div className="text-center">
          <p className="text-purple-300 text-sm mb-1">o ingresá el código</p>
          <p className="text-6xl font-black font-mono text-white tracking-[0.2em]">{room.code}</p>
        </div>
      </div>

      {/* Players list */}
      <div className="relative z-10 mt-10 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <p className="text-purple-300 text-sm font-medium uppercase tracking-wider">Jugadores conectados</p>
          <span className="bg-white/10 text-white font-bold text-sm px-3 py-1 rounded-full">{players.length}</span>
        </div>

        {players.length === 0 ? (
          <p className="text-purple-400 text-center text-sm py-4">Esperando jugadores...</p>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
            {players.map(p => (
              <span
                key={p.id}
                className="bg-white/10 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-full border border-white/20"
              >
                {p.full_name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Question display ──────────────────────────────────── */
function QuestionDisplay({ quizEvent, question, questionNumber, totalQuestions }) {
  if (!question) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Cargando pregunta...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Question number */}
      <div className="text-center pt-8 pb-2">
        <span className="text-white/40 text-lg font-semibold tracking-wide">
          Pregunta {questionNumber} <span className="text-white/20">/ {totalQuestions}</span>
        </span>
      </div>

      {/* Timer — centrado y grande */}
      <div className="flex justify-center py-4">
        {quizEvent.question_started_at && (
          <DisplayTimer
            totalSeconds={quizEvent.timer_seconds}
            startedAt={quizEvent.question_started_at}
          />
        )}
      </div>

      {/* Question text */}
      <div className="flex-1 flex items-center justify-center px-16 py-4">
        <h2 className="text-white text-5xl font-bold text-center leading-tight max-w-5xl">
          {question.text}
        </h2>
      </div>

      {/* Options 2x2 grid */}
      <div className="grid grid-cols-2 gap-4 p-8 pt-0">
        {['A', 'B', 'C', 'D'].map(opt => {
          const val = question[`option_${opt.toLowerCase()}`]
          return (
            <div
              key={opt}
              className={`${OPTION_COLORS[opt]} rounded-3xl p-6 flex items-center gap-5 shadow-lg`}
            >
              <span className={`${OPTION_LIGHT[opt]} text-white text-2xl font-black w-14 h-14 rounded-2xl flex items-center justify-center shrink-0`}>
                {opt}
              </span>
              <span className="text-white text-2xl font-semibold leading-snug">{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Ranking display ───────────────────────────────────── */
function RankingDisplay({ players, questionNumber, totalQuestions, isFinished }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-indigo-950 flex flex-col items-center justify-center p-10">
      <h2 className="text-white text-4xl font-black mb-2">
        {isFinished ? '🏁 Ranking Final' : `📊 Ranking parcial`}
      </h2>
      {!isFinished && (
        <p className="text-indigo-300 text-lg mb-8">Pregunta {questionNumber} / {totalQuestions}</p>
      )}
      {isFinished && <div className="mb-8" />}

      <div className="w-full max-w-xl">
        <QuizRankingTable players={players} />
      </div>
    </div>
  )
}

/* ─── QuizDisplayPage ───────────────────────────────────── */
export default function QuizDisplayPage() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)
  const [quizEvent, setQuizEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    init()
  }, [code])

  async function init() {
    const roomData = await getRoomByCode(code)
    if (!roomData) { setError('Cuarto no encontrado.'); setLoading(false); return }
    setRoom(roomData)

    const { data: event } = await supabase
      .from('quiz_events')
      .select('*')
      .eq('room_id', roomData.id)
      .maybeSingle()

    if (!event) { setError('El Quiz todavía no está configurado.'); setLoading(false); return }
    setQuizEvent(event)

    if (event.status !== 'lobby') {
      const { data: qs } = await supabase
        .from('quiz_questions').select('*')
        .eq('quiz_event_id', event.id).order('position')
      if (qs) setQuestions(qs)
    }

    const { data: ps } = await supabase
      .from('quiz_players').select('id, full_name, total_score, created_at')
      .eq('quiz_event_id', event.id).order('created_at', { ascending: true })
    if (ps) setPlayers(ps)

    setLoading(false)
  }

  // Realtime: quiz event updates
  useEffect(() => {
    if (!quizEvent) return
    const channel = supabase
      .channel(`quiz-display-event-${quizEvent.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quiz_events', filter: `id=eq.${quizEvent.id}` },
        async payload => {
          setQuizEvent(payload.new)
          // Load questions when game starts
          if (payload.new.status !== 'lobby' && questions.length === 0) {
            const { data: qs } = await supabase
              .from('quiz_questions').select('*')
              .eq('quiz_event_id', quizEvent.id).order('position')
            if (qs) setQuestions(qs)
          }
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [quizEvent?.id])

  // Realtime: players (lobby + ranking updates)
  useEffect(() => {
    if (!quizEvent) return
    const channel = supabase
      .channel(`quiz-display-players-${quizEvent.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_players', filter: `quiz_event_id=eq.${quizEvent.id}` },
        async () => {
          const { data } = await supabase
            .from('quiz_players').select('id, full_name, total_score, created_at')
            .eq('quiz_event_id', quizEvent.id).order('total_score', { ascending: false })
          if (data) setPlayers(data)
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [quizEvent?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="text-indigo-300 text-sm">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-6">
        <p className="text-indigo-300 text-center">{error}</p>
      </div>
    )
  }

  if (!quizEvent || !room) return null

  const currentQuestion = questions[quizEvent.current_question_index]
  const questionNumber = (quizEvent.current_question_index ?? 0) + 1

  if (quizEvent.status === 'lobby') {
    return <LobbyDisplay room={room} quizEvent={quizEvent} players={players} />
  }

  if (quizEvent.status === 'question') {
    return (
      <QuestionDisplay
        quizEvent={quizEvent}
        question={currentQuestion}
        questionNumber={questionNumber}
        totalQuestions={questions.length}
      />
    )
  }

  if (quizEvent.status === 'ranking') {
    return (
      <RankingDisplay
        players={players}
        questionNumber={questionNumber}
        totalQuestions={questions.length}
        isFinished={false}
      />
    )
  }

  if (quizEvent.status === 'finished') {
    return (
      <RankingDisplay
        players={players}
        questionNumber={questionNumber}
        totalQuestions={questions.length}
        isFinished={true}
      />
    )
  }

  return null
}
