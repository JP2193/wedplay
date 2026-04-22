import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { supabase } from '../lib/supabase'
import { getRoomByCode } from '../lib/rooms'
import QuizRankingTable from '../components/quiz/shared/QuizRankingTable'

/* ─── Ping sound ─────────────────────────────────────── */
function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05)
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + i * 0.05 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 2)
      osc.start(ctx.currentTime + i * 0.05)
      osc.stop(ctx.currentTime + i * 0.05 + 2)
    })
  } catch {}
}

/* ─── Display Timer ──────────────────────────────────── */
function DisplayTimer({ totalSeconds, startedAt, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
    function tick() {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
      const left = Math.max(0, totalSeconds - elapsed)
      setRemaining(left)
      if (left <= 0 && !firedRef.current) { firedRef.current = true; onExpire?.() }
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [startedAt, totalSeconds])

  const pct = remaining / totalSeconds
  const size = 180; const radius = 78; const circ = 2 * Math.PI * radius
  const color = pct > 0.5 ? '#34d399' : pct > 0.25 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#ffffff15" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={`${circ * pct} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.1s linear, stroke 0.3s' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-black tabular-nums text-white"
        style={{ fontSize: Math.ceil(remaining) >= 10 ? '3.5rem' : '4rem', color }}>
        {Math.ceil(remaining)}
      </span>
    </div>
  )
}

/* ─── Lobby ──────────────────────────────────────────── */
function LobbyDisplay({ room, adivinaEvent, players }) {
  const joinUrl = `${window.location.origin}/${room.code}/adivina`

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      <div className="text-center mb-8 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src="/img/adivina.png" alt="Adivina" className="w-12 h-12 object-contain" />
          <h1 className="text-4xl font-black text-white tracking-tight">Adivina Quién</h1>
        </div>
        {/* Protagonistas */}
        <div className="flex items-center justify-center gap-8 mt-4">
          {[
            { name: adivinaEvent.person1_name, photo: adivinaEvent.person1_photo_url },
            { name: adivinaEvent.person2_name, photo: adivinaEvent.person2_photo_url },
          ].map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20">
                {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <span className="text-3xl font-black text-white">{p.name[0]}</span>
                    </div>}
              </div>
              <span className="text-purple-200 font-semibold">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

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
              <span key={p.id} className="bg-white/10 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-full border border-white/20">
                {p.full_name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Question display ───────────────────────────────── */
function QuestionDisplay({ adivinaEvent, question, questionNumber, totalQuestions }) {
  const [timerExpired, setTimerExpired] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const pingFiredRef = useRef(false)

  useEffect(() => {
    // Reset on new question
    setTimerExpired(false)
    setCountdown(null)
    setRevealed(false)
    pingFiredRef.current = false
  }, [question?.id])

  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) { setRevealed(true); setCountdown(null); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function handleTimerExpire() {
    if (pingFiredRef.current) return
    pingFiredRef.current = true
    setTimerExpired(true)
    playPing()
    setCountdown(5)
  }

  if (!question) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400 text-lg">Cargando pregunta...</p>
    </div>
  )

  const p1 = { person: 1, name: adivinaEvent.person1_name, photo: adivinaEvent.person1_photo_url }
  const p2 = { person: 2, name: adivinaEvent.person2_name, photo: adivinaEvent.person2_photo_url }
  const correct = question.correct_person === 1 ? p1 : p2

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="text-center pt-8 pb-2">
        <span className="text-white/40 text-lg font-semibold">
          Pregunta {questionNumber} <span className="text-white/20">/ {totalQuestions}</span>
        </span>
      </div>

      {/* Timer o countdown */}
      <div className="flex justify-center py-4">
        {!timerExpired && adivinaEvent.question_started_at && (
          <DisplayTimer totalSeconds={adivinaEvent.timer_seconds} startedAt={adivinaEvent.question_started_at} onExpire={handleTimerExpire} />
        )}
        {timerExpired && !revealed && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-amber-400 text-8xl font-black tabular-nums">{countdown}</span>
            <span className="text-white/40 text-lg uppercase tracking-widest">revelando...</span>
          </div>
        )}
        {revealed && (
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-emerald-500 px-8 py-4 rounded-3xl shadow-xl shadow-emerald-500/30">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/40">
                {correct.photo ? <img src={correct.photo} alt={correct.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/20 flex items-center justify-center">
                      <span className="text-xl font-black text-white">{correct.name[0]}</span>
                    </div>}
              </div>
              <span className="text-white text-3xl font-black">{correct.name}</span>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Pregunta */}
      <div className="flex-1 flex items-center justify-center px-16 py-4">
        <h2 className="text-white text-5xl font-bold text-center leading-tight max-w-5xl">
          {question.text}
        </h2>
      </div>

      {/* Fotos 2 columnas */}
      <div className="grid grid-cols-2 gap-6 p-10 pt-0">
        {[p1, p2].map(({ person, name, photo }) => {
          const isCorrect = revealed && question.correct_person === person
          const isWrong = revealed && question.correct_person !== person
          return (
            <div key={person} className={`rounded-3xl overflow-hidden relative transition-all duration-500
              ${isCorrect ? 'ring-4 ring-emerald-400 shadow-2xl shadow-emerald-500/30' : isWrong ? 'opacity-30' : ''}`}>
              <div className="h-64 bg-white/5">
                {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <span className="text-8xl font-black text-white/30">{name[0]}</span>
                    </div>}
              </div>
              <div className={`px-6 py-4 flex items-center justify-between
                ${isCorrect ? 'bg-emerald-500' : 'bg-white/10'}`}>
                <span className="text-white text-2xl font-black">{name}</span>
                {isCorrect && (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Ranking display ────────────────────────────────── */
function RankingDisplay({ players, questionNumber, totalQuestions, isFinished }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-violet-950 flex flex-col items-center justify-center p-10">
      <h2 className="text-white text-4xl font-black mb-2">
        {isFinished ? '🏁 Ranking Final' : '📊 Ranking parcial'}
      </h2>
      {!isFinished && <p className="text-violet-300 text-lg mb-8">Pregunta {questionNumber} / {totalQuestions}</p>}
      {isFinished && <div className="mb-8" />}
      <div className="w-full max-w-xl">
        <QuizRankingTable players={players} />
      </div>
    </div>
  )
}

/* ─── AdivinaDisplayPage ─────────────────────────────── */
export default function AdivinaDisplayPage() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)
  const [adivinaEvent, setAdivinaEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { init() }, [code])

  async function init() {
    const roomData = await getRoomByCode(code)
    if (!roomData) { setError('Cuarto no encontrado.'); setLoading(false); return }
    setRoom(roomData)

    const { data: event } = await supabase.from('adivina_events').select('*')
      .eq('room_id', roomData.id).maybeSingle()
    if (!event) { setError('Adivina Quién todavía no está configurado.'); setLoading(false); return }
    setAdivinaEvent(event)

    if (event.status !== 'lobby') {
      const { data: qs } = await supabase.from('adivina_questions').select('*')
        .eq('adivina_event_id', event.id).order('position')
      if (qs) setQuestions(qs)
    }

    const { data: ps } = await supabase.from('adivina_players').select('id, full_name, total_score, joined_at')
      .eq('adivina_event_id', event.id).order('joined_at', { ascending: true })
    if (ps) setPlayers(ps)

    setLoading(false)
  }

  // Realtime: event updates
  useEffect(() => {
    if (!adivinaEvent) return
    const channel = supabase.channel(`adivina-display-event-${adivinaEvent.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'adivina_events', filter: `id=eq.${adivinaEvent.id}` },
        async payload => {
          setAdivinaEvent(payload.new)
          if (payload.new.status !== 'lobby' && questions.length === 0) {
            const { data: qs } = await supabase.from('adivina_questions').select('*')
              .eq('adivina_event_id', adivinaEvent.id).order('position')
            if (qs) setQuestions(qs)
          }
        }
      ).subscribe()
    return () => supabase.removeChannel(channel)
  }, [adivinaEvent?.id])

  // Realtime: players
  useEffect(() => {
    if (!adivinaEvent) return
    const channel = supabase.channel(`adivina-display-players-${adivinaEvent.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'adivina_players', filter: `adivina_event_id=eq.${adivinaEvent.id}` },
        async () => {
          const { data } = await supabase.from('adivina_players').select('id, full_name, total_score, joined_at')
            .eq('adivina_event_id', adivinaEvent.id).order('total_score', { ascending: false })
          if (data) setPlayers(data)
        }
      ).subscribe()
    return () => supabase.removeChannel(channel)
  }, [adivinaEvent?.id])

  if (loading) return (
    <div className="min-h-screen bg-violet-950 flex items-center justify-center">
      <div className="text-violet-300 text-sm">Cargando...</div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-violet-950 flex items-center justify-center p-6">
      <p className="text-violet-300 text-center">{error}</p>
    </div>
  )
  if (!adivinaEvent || !room) return null

  const currentQuestion = questions[adivinaEvent.current_question_index]
  const questionNumber = (adivinaEvent.current_question_index ?? 0) + 1

  if (adivinaEvent.status === 'lobby') return <LobbyDisplay room={room} adivinaEvent={adivinaEvent} players={players} />
  if (adivinaEvent.status === 'question') return (
    <QuestionDisplay adivinaEvent={adivinaEvent} question={currentQuestion} questionNumber={questionNumber} totalQuestions={questions.length} />
  )
  if (adivinaEvent.status === 'ranking') return (
    <RankingDisplay players={players} questionNumber={questionNumber} totalQuestions={questions.length} isFinished={false} />
  )
  if (adivinaEvent.status === 'finished') return (
    <RankingDisplay players={players} questionNumber={questionNumber} totalQuestions={questions.length} isFinished={true} />
  )
  return null
}
