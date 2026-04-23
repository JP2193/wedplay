import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { supabase } from '../lib/supabase'
import { getRoomByCode } from '../lib/rooms'
import QuizRankingTable from '../components/quiz/shared/QuizRankingTable'

/* ─── Ping sound ─────────────────────────────────────── */
// Solo se inicializa tras gesto del usuario (botón de sonido)
let _audioCtx = null

function playPing() {
  // Si no hay contexto o está suspendido, no reproducir
  if (!_audioCtx || _audioCtx.state !== 'running') return
  try {
    const ctx = _audioCtx
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
const BG = 'bg-gradient-to-b from-[#0f0826] via-[#1a0f3d] to-[#0c0520]'

function PersonCircle({ name, photo, ringColor }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className={`w-60 h-60 rounded-full overflow-hidden border-4 ${ringColor}
        shadow-[0_0_60px_rgba(255,255,255,0.07)]`}>
        {photo
          ? <img src={photo} alt={name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <span className="text-8xl font-black text-white/40">{name[0]?.toUpperCase()}</span>
            </div>}
      </div>
      <span className="text-white text-4xl font-black tracking-tight">{name}</span>
    </div>
  )
}

function QuestionDisplay({ adivinaEvent, question, questionNumber, totalQuestions }) {
  const [timerExpired, setTimerExpired] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const pingFiredRef = useRef(false)
  const mountTimeRef = useRef(new Date().toISOString())

  useEffect(() => {
    mountTimeRef.current = new Date().toISOString()
    setTimerExpired(false)
    setCountdown(null)
    pingFiredRef.current = false
  }, [question?.id])

  useEffect(() => {
    if (countdown === null || countdown <= 0) return
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
    <div className={`min-h-screen ${BG} flex items-center justify-center`}>
      <p className="text-white/30 text-lg">Cargando pregunta...</p>
    </div>
  )

  const startedAt = adivinaEvent.question_started_at || mountTimeRef.current
  const p1 = { person: 1, name: adivinaEvent.person1_name, photo: adivinaEvent.person1_photo_url }
  const p2 = { person: 2, name: adivinaEvent.person2_name, photo: adivinaEvent.person2_photo_url }
  const correct = question.correct_person === 1 ? p1 : p2

  // ── Cuenta regresiva ─────────────────────────────────────────────────────
  if (timerExpired && countdown !== null && countdown > 0) {
    return (
      <div className={`min-h-screen ${BG} flex flex-col items-center justify-center gap-4`}>
        <span className="text-white/25 text-3xl font-semibold uppercase tracking-[0.3em]">Revelando en</span>
        <span className="font-black tabular-nums leading-none text-amber-400"
          style={{ fontSize: '20rem', textShadow: '0 0 120px rgba(251,191,36,0.35)' }}>
          {countdown}
        </span>
      </div>
    )
  }

  // ── Reveal ───────────────────────────────────────────────────────────────
  if (timerExpired && countdown === 0) {
    return (
      <div className={`min-h-screen ${BG} flex flex-col items-center justify-center gap-8`}>
        <span className="text-white/30 text-2xl font-semibold uppercase tracking-[0.3em]">La respuesta es</span>
        <div className="w-72 h-72 rounded-full overflow-hidden border-8 border-emerald-400
          shadow-[0_0_0_16px_rgba(52,211,153,0.08),0_0_80px_rgba(52,211,153,0.3)]">
          {correct.photo
            ? <img src={correct.photo} alt={correct.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <span className="text-9xl font-black text-white/40">{correct.name[0]}</span>
              </div>}
        </div>
        <p className="text-white font-black tracking-tight" style={{ fontSize: '5.5rem', lineHeight: 1 }}>
          {correct.name}
        </p>
        <div className="flex items-center gap-3 bg-emerald-500/15 border border-emerald-400/30 px-8 py-3.5 rounded-2xl mt-2">
          <svg className="w-7 h-7 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-300 text-2xl font-bold">Respuesta correcta</span>
        </div>
      </div>
    )
  }

  // ── Pregunta ─────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${BG} flex flex-col overflow-hidden`}>

      {/* Glow ambiental */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-violet-500/8 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-indigo-500/8 rounded-full blur-3xl translate-y-1/3" />
      </div>

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-14 pt-10 pb-2">
        <div className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-2xl px-5 py-2.5">
          <span className="text-white/35 text-sm font-bold tracking-widest uppercase">Pregunta</span>
          <span className="text-white text-xl font-black tabular-nums">{questionNumber}</span>
          <span className="text-white/15 text-base mx-0.5">/</span>
          <span className="text-white/35 text-base font-semibold">{totalQuestions}</span>
        </div>
        <DisplayTimer
          totalSeconds={adivinaEvent.timer_seconds}
          startedAt={startedAt}
          onExpire={handleTimerExpire}
        />
      </div>

      {/* Pregunta */}
      <div className="relative flex justify-center px-20 pt-6 pb-4">
        <div className="bg-white/5 border border-white/8 rounded-3xl px-14 py-8 max-w-5xl w-full">
          <h2 className="text-white text-5xl font-black text-center leading-tight">
            {question.text}
          </h2>
        </div>
      </div>

      {/* Fotos + VS */}
      <div className="relative flex-1 flex items-center justify-center gap-16 px-16 pb-14">
        <PersonCircle name={p1.name} photo={p1.photo} ringColor="border-rose-400/70" />

        <div className="flex flex-col items-center gap-1 select-none">
          <span className="text-white/10 font-black italic tracking-tighter" style={{ fontSize: '5rem', lineHeight: 1 }}>VS</span>
        </div>

        <PersonCircle name={p2.name} photo={p2.photo} ringColor="border-indigo-400/70" />
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
  const [audioOn, setAudioOn] = useState(false)

  function toggleAudio() {
    if (audioOn) {
      _audioCtx?.suspend()
      setAudioOn(false)
    } else {
      try {
        if (!_audioCtx) {
          _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        }
        _audioCtx.resume().then(() => {
          // Blip silencioso para confirmar que el contexto está desbloqueado
          const osc = _audioCtx.createOscillator()
          const gain = _audioCtx.createGain()
          gain.gain.setValueAtTime(0, _audioCtx.currentTime)
          osc.connect(gain); gain.connect(_audioCtx.destination)
          osc.start(); osc.stop(_audioCtx.currentTime + 0.001)
        })
      } catch {}
      setAudioOn(true)
    }
  }

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

  let content = null
  if (adivinaEvent.status === 'lobby') content = <LobbyDisplay room={room} adivinaEvent={adivinaEvent} players={players} />
  else if (adivinaEvent.status === 'question') content = (
    <QuestionDisplay adivinaEvent={adivinaEvent} question={currentQuestion} questionNumber={questionNumber} totalQuestions={questions.length} />
  )
  else if (adivinaEvent.status === 'ranking') content = (
    <RankingDisplay players={players} questionNumber={questionNumber} totalQuestions={questions.length} isFinished={false} />
  )
  else if (adivinaEvent.status === 'finished') content = (
    <RankingDisplay players={players} questionNumber={questionNumber} totalQuestions={questions.length} isFinished={true} />
  )

  return (
    <div className="relative">
      {content}

      {/* Botón de sonido — ícono circular, top-right */}
      <button
        onClick={toggleAudio}
        title={audioOn ? 'Silenciar' : 'Activar sonido'}
        className={`fixed top-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 shadow-lg
          ${audioOn
            ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/40 hover:bg-emerald-400'
            : 'bg-red-500/20 border-red-400/60 text-red-400 hover:bg-red-500/30'}`}
      >
        {audioOn ? (
          /* Speaker con ondas — activo */
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H3v6h3l5 4V5z" />
          </svg>
        ) : (
          /* Speaker con banda cruzada — mute */
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
          </svg>
        )}
      </button>
    </div>
  )
}
