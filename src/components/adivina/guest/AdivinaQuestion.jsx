import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizCountdown from '../../quiz/shared/QuizCountdown'

export default function AdivinaQuestion({ adivinaEvent, question, player, onResult }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // countdown: null = timer corriendo | 5..1 = cuenta regresiva | 0 = revelar
  const [countdown, setCountdown] = useState(null)
  const answeredRef = useRef(false)
  const mountTimeRef = useRef(new Date().toISOString())

  useEffect(() => {
    mountTimeRef.current = new Date().toISOString()
    setSelected(null)
    setResult(null)
    setCountdown(null)
    answeredRef.current = false
  }, [question.id])

  // Cuenta regresiva 5 → 0
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
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
    // No ping en móvil — el ping suena solo en pantalla de proyección
    setCountdown(5)
  }

  const startedAt = adivinaEvent.question_started_at || mountTimeRef.current
  const questionNumber = (adivinaEvent.current_question_index ?? 0) + 1

  const persons = [
    { person: 1, name: adivinaEvent.person1_name, photo: adivinaEvent.person1_photo_url },
    { person: 2, name: adivinaEvent.person2_name, photo: adivinaEvent.person2_photo_url },
  ]

  // ── Pantalla de cuenta regresiva (5-4-3-2-1) ─────────────────────────────
  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col items-center justify-center gap-6">
        <span className="text-white/40 text-xs font-bold tracking-widest uppercase">Revelando en</span>
        <span className="text-amber-400 font-black tabular-nums leading-none" style={{ fontSize: '8rem' }}>
          {countdown}
        </span>
        <span className="text-white/20 text-xs tracking-widest uppercase">
          {selected ? 'Tu respuesta fue registrada' : 'No respondiste a tiempo'}
        </span>
      </div>
    )
  }

  // ── Pantalla de reveal (countdown llegó a 0) ──────────────────────────────
  if (countdown === 0) {
    const correctPerson = result?.correct_person ?? question.correct_person
    const correctName  = correctPerson === 1 ? adivinaEvent.person1_name      : adivinaEvent.person2_name
    const correctPhoto = correctPerson === 1 ? adivinaEvent.person1_photo_url : adivinaEvent.person2_photo_url
    const answered = selected !== null
    const isCorrect = result?.is_correct

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col items-center justify-center px-8 gap-8">

        {/* Veredicto */}
        {answered ? (
          isCorrect ? (
            <div className="flex items-center gap-2.5 bg-emerald-500 px-7 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white font-black text-2xl">¡Acertaste!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-red-500 px-7 py-3.5 rounded-2xl shadow-lg shadow-red-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-white font-black text-2xl">Incorrecto</span>
            </div>
          )
        ) : (
          <div className="bg-white/10 px-7 py-3.5 rounded-2xl">
            <span className="text-white/50 font-semibold text-lg">Sin respuesta</span>
          </div>
        )}

        {/* Respuesta correcta */}
        <div className="flex flex-col items-center gap-5">
          <span className="text-white/40 text-xs font-bold tracking-widest uppercase">La respuesta es</span>
          <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-emerald-400 shadow-2xl shadow-emerald-400/30">
            {correctPhoto
              ? <img src={correctPhoto} alt={correctName} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <span className="text-5xl font-black text-white">{correctName[0]?.toUpperCase()}</span>
                </div>
            }
          </div>
          <span className="text-white text-3xl font-black">{correctName}</span>
        </div>

      </div>
    )
  }

  // ── Pantalla de pregunta (timer corriendo) ────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col">

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-[0.65rem] font-bold tracking-widest uppercase">Pregunta</span>
          <span className="text-white/60 text-sm font-semibold tabular-nums">{questionNumber}</span>
        </div>
        <QuizCountdown
          totalSeconds={adivinaEvent.timer_seconds}
          startedAt={startedAt}
          onExpire={handleExpire}
        />
      </div>

      {/* Pregunta */}
      <div className="px-5 pt-2 pb-6">
        <div className="bg-white/5 rounded-3xl border border-white/10 px-5 py-5">
          <h2 className="text-white text-[1.35rem] font-bold leading-snug text-center">
            {question.text}
          </h2>
        </div>
      </div>

      {/* Fotos — verticales, centradas, la foto ES el botón */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 pb-10">
        {persons.map(({ person, name, photo }) => {
          const isSelected = selected === person
          const isDimmed   = selected !== null && !isSelected
          return (
            <button
              key={person}
              onClick={() => handleSelect(person)}
              disabled={!!selected || submitting}
              className={`flex flex-col items-center gap-3 transition-all duration-300 ${isDimmed ? 'opacity-30' : ''}`}
            >
              <div className={`w-36 h-36 rounded-full overflow-hidden border-4 transition-all duration-300
                ${isSelected
                  ? 'border-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.2)] selected-waiting'
                  : 'border-white/20'}`}>
                {photo
                  ? <img src={photo} alt={name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <span className="text-4xl font-black text-white">{name[0]?.toUpperCase()}</span>
                    </div>
                }
              </div>
              <span className={`font-bold text-lg transition-colors duration-300 ${isSelected ? 'text-amber-400' : 'text-white/80'}`}>
                {name}
              </span>
            </button>
          )
        })}
      </div>

    </div>
  )
}
