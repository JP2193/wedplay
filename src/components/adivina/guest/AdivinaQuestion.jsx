import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizCountdown from '../../quiz/shared/QuizCountdown'

function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Dos tonos superpuestos para un "ping" más rico
    ;[880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05)
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + i * 0.05 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 1.8)
      osc.start(ctx.currentTime + i * 0.05)
      osc.stop(ctx.currentTime + i * 0.05 + 1.8)
    })
  } catch {}
}

export default function AdivinaQuestion({ adivinaEvent, question, player, onResult }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(null) // null | 5..0
  const answeredRef = useRef(false)
  const mountTimeRef = useRef(new Date().toISOString())

  useEffect(() => {
    mountTimeRef.current = new Date().toISOString()
    setSelected(null)
    setResult(null)
    setRevealed(false)
    setCountdown(null)
    answeredRef.current = false
  }, [question.id])

  // Countdown tick: 5 → 0 → reveal
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) { setRevealed(true); setCountdown(null); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleSelect(person) {
    if (answeredRef.current || submitting) return
    answeredRef.current = true
    setSelected(person)
    setSubmitting(true)

    const timeTakenMs = Date.now() - new Date(mountTimeRef.current).getTime()
    const { data, error } = await supabase.rpc('submit_adivina_answer', {
      p_player_id: player.id,
      p_session_token: player._sessionToken,
      p_question_id: question.id,
      p_selected_person: person,
      p_time_taken_ms: timeTakenMs,
    })
    if (!error && data) { setResult(data); onResult?.(data) }
    setSubmitting(false)
  }

  function handleExpire() {
    // No sonido en el teléfono — el ping suena en la pantalla de proyección
    setCountdown(5)
  }

  const startedAt = adivinaEvent.question_started_at || mountTimeRef.current
  const questionNumber = (adivinaEvent.current_question_index ?? 0) + 1

  const p1 = { person: 1, name: adivinaEvent.person1_name, photo: adivinaEvent.person1_photo_url }
  const p2 = { person: 2, name: adivinaEvent.person2_name, photo: adivinaEvent.person2_photo_url }

  function getCardCls(person) {
    if (!selected && countdown === null) {
      // Normal: clickeable
      return 'bg-white/10 border border-white/20 active:scale-[0.97]'
    }
    if (countdown !== null) {
      // Timer expiró, esperando reveal: selected = amber glow, otros = dimmed
      if (selected === person) return 'bg-white/15 border-2 border-amber-400 selected-waiting'
      if (selected === null) return 'bg-white/10 border border-white/10 opacity-60'
      return 'bg-white/5 border border-white/10 opacity-40'
    }
    // Seleccionada, timer corriendo
    if (selected === person) return 'bg-white/15 border-2 border-amber-400 selected-waiting'
    return 'bg-white/5 border border-white/10 opacity-40'
  }

  function getRevealCls(person) {
    if (!revealed || !result) return getCardCls(person)
    if (person === result.correct_person) return 'bg-emerald-500 border-2 border-emerald-300 shadow-lg shadow-emerald-500/40'
    if (person === selected && !result.is_correct) return 'bg-red-500/20 border border-red-400/40'
    return 'bg-white/5 border border-white/10 opacity-30'
  }

  function PersonCard({ person, name, photo }) {
    const cls = revealed ? getRevealCls(person) : getCardCls(person)
    const isCorrect = revealed && result && person === result.correct_person
    const isWrong = revealed && result && person === selected && !result.is_correct

    return (
      <button
        onClick={() => handleSelect(person)}
        disabled={!!selected || submitting || countdown !== null}
        className={`flex-1 rounded-3xl p-4 flex flex-col items-center gap-3 transition-all duration-300 ${cls}`}
      >
        <div className={`w-28 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300
          ${isCorrect ? 'border-white/60 shadow-lg shadow-emerald-400/40' : isWrong ? 'border-red-400/40' : 'border-white/20'}`}>
          {photo
            ? <img src={photo} alt={name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center bg-white/10">
                <span className="text-4xl font-black text-white">{name[0]?.toUpperCase()}</span>
              </div>
          }
        </div>
        <span className={`text-sm font-bold ${isCorrect ? 'text-white' : 'text-white/80'}`}>{name}</span>
        {isCorrect && (
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-white text-xs font-bold">Correcto</span>
          </div>
        )}
        {isWrong && (
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-red-300 text-xs font-bold">Incorrecto</span>
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col">

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs font-bold tracking-widest uppercase">Pregunta</span>
          <span className="text-white/60 text-sm font-semibold tabular-nums">{questionNumber}</span>
        </div>
        {countdown === null ? (
          <QuizCountdown
            totalSeconds={adivinaEvent.timer_seconds}
            startedAt={startedAt}
            onExpire={handleExpire}
          />
        ) : (
          /* Countdown de 5s post-ping */
          <div className="flex flex-col items-center">
            <span className="text-amber-400 text-3xl font-black tabular-nums animate-pulse">{countdown}</span>
            <span className="text-white/30 text-[0.6rem] uppercase tracking-widest">revelando</span>
          </div>
        )}
      </div>

      {/* Pregunta */}
      <div className="px-5 pt-2 pb-5">
        <div className="bg-white/5 rounded-3xl border border-white/10 px-5 py-5 shadow-inner">
          <h2 className="text-white text-[1.45rem] font-bold leading-snug text-center">
            {question.text}
          </h2>
        </div>
      </div>

      {/* Fotos */}
      <div className="flex-1 px-5 pb-8 flex gap-3">
        <PersonCard person={p1.person} name={p1.name} photo={p1.photo} />
        <PersonCard person={p2.person} name={p2.name} photo={p2.photo} />
      </div>

      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-10 right-8 w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute top-24 left-12 w-1.5 h-1.5 bg-purple-300/20 rounded-full" />
      </div>
    </div>
  )
}
