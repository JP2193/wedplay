import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizCountdown from '../../quiz/shared/QuizCountdown'

export default function AdivinaQuestion({ adivinaEvent, question, player, onResult }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(null)
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

  // Countdown 5 → 0 → reveal
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) { setRevealed(true); setCountdown(null); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleSelect(person) {
    if (answeredRef.current || submitting || countdown !== null) return
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
    // Sin ping en móvil — el ping suena solo en la pantalla de proyección
    setCountdown(5)
  }

  const startedAt = adivinaEvent.question_started_at || mountTimeRef.current
  const questionNumber = (adivinaEvent.current_question_index ?? 0) + 1

  const persons = [
    { person: 1, name: adivinaEvent.person1_name, photo: adivinaEvent.person1_photo_url },
    { person: 2, name: adivinaEvent.person2_name, photo: adivinaEvent.person2_photo_url },
  ]

  function getCardCls(person) {
    const isSelected = selected === person
    const isWaiting = countdown !== null

    if (revealed && result) {
      if (person === result.correct_person) return 'border-2 border-emerald-400 bg-emerald-500/10'
      if (person === selected && !result.is_correct) return 'border border-red-400/30 bg-red-500/10 opacity-60'
      return 'border border-white/10 opacity-30'
    }
    if (isSelected) return 'border-2 border-amber-400 bg-white/10 selected-waiting'
    if (selected !== null || isWaiting) return 'border border-white/10 opacity-40'
    return 'border border-white/15 bg-white/5 active:scale-[0.98]'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col">

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-[0.65rem] font-bold tracking-widest uppercase">Pregunta</span>
          <span className="text-white/60 text-sm font-semibold tabular-nums">{questionNumber}</span>
        </div>
        {countdown === null ? (
          <QuizCountdown
            totalSeconds={adivinaEvent.timer_seconds}
            startedAt={startedAt}
            onExpire={handleExpire}
          />
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-amber-400 text-3xl font-black tabular-nums">{countdown}</span>
            <span className="text-white/30 text-[0.6rem] uppercase tracking-widest">revelando</span>
          </div>
        )}
      </div>

      {/* Pregunta */}
      <div className="px-5 pt-2 pb-6">
        <div className="bg-white/5 rounded-3xl border border-white/10 px-5 py-5">
          <h2 className="text-white text-[1.35rem] font-bold leading-snug text-center">
            {question.text}
          </h2>
        </div>
      </div>

      {/* Opciones — vertical en mobile */}
      <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
        {persons.map(({ person, name, photo }) => {
          const isCorrect = revealed && result && person === result.correct_person
          const isWrong = revealed && result && person === selected && !result.is_correct

          return (
            <button
              key={person}
              onClick={() => handleSelect(person)}
              disabled={!!selected || submitting || countdown !== null}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${getCardCls(person)}`}
            >
              {/* Foto circular */}
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 shrink-0 transition-all duration-300
                ${isCorrect ? 'border-emerald-400 shadow-lg shadow-emerald-400/30' : isWrong ? 'border-red-400/40' : 'border-white/20'}`}>
                {photo
                  ? <img src={photo} alt={name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <span className="text-2xl font-black text-white">{name[0]?.toUpperCase()}</span>
                    </div>
                }
              </div>

              {/* Nombre */}
              <span className="flex-1 text-left text-white font-bold text-lg">{name}</span>

              {/* Ícono reveal */}
              {isCorrect && (
                <svg className="w-6 h-6 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isWrong && (
                <svg className="w-6 h-6 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
