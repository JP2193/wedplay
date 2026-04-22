import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizCountdown from '../shared/QuizCountdown'

const BADGE_COLORS = {
  A: 'bg-indigo-500 text-white',
  B: 'bg-amber-500 text-white',
  C: 'bg-rose-500 text-white',
  D: 'bg-emerald-500 text-white',
}

export default function QuizQuestion({ quizEvent, question, player, onResult, totalQuestions }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const answeredRef = useRef(false)
  const mountTimeRef = useRef(new Date().toISOString())

  useEffect(() => {
    mountTimeRef.current = new Date().toISOString()
    setSelected(null)
    setResult(null)
    setRevealed(false)
    answeredRef.current = false
  }, [question.id])

  async function handleSelect(opt) {
    if (answeredRef.current || submitting) return
    answeredRef.current = true
    setSelected(opt)
    setSubmitting(true)

    const timeTakenMs = Date.now() - new Date(mountTimeRef.current).getTime()

    const { data, error } = await supabase.rpc('submit_quiz_answer', {
      p_player_id: player.id,
      p_session_token: player._sessionToken,
      p_question_id: question.id,
      p_selected_option: opt,
      p_time_taken_ms: timeTakenMs,
    })

    if (!error && data) {
      setResult(data)
      onResult?.(data)
    }
    setSubmitting(false)
  }

  function handleExpire() {
    setRevealed(true)
  }

  function getOptionStyle(opt) {
    // Sin selección: card normal
    if (!selected) {
      return 'bg-white border border-gray-200 text-gray-800 active:scale-[0.98]'
    }
    // Revelado (timer expiró)
    if (revealed && result) {
      if (opt === result.correct_option) return 'bg-emerald-500 border-emerald-500 text-white'
      if (opt === selected && !result.is_correct) return 'bg-red-50 border border-red-200 text-red-500'
      return 'bg-gray-50 border border-gray-100 text-gray-300'
    }
    // Seleccionada, timer aún corriendo: solo marcar seleccionada
    if (selected === opt) return 'bg-indigo-50 border-2 border-indigo-400 text-gray-800'
    return 'bg-gray-50 border border-gray-100 text-gray-300'
  }

  function getIcon(opt) {
    if (!revealed || !result || !selected) return null
    if (opt === result.correct_option) {
      return (
        <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
    if (opt === selected && !result.is_correct) {
      return (
        <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }
    return null
  }

  const startedAt = quizEvent.question_started_at || mountTimeRef.current
  const questionNumber = (quizEvent.current_question_index ?? 0) + 1

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-400">
          {questionNumber}
          {totalQuestions ? <span className="text-gray-300"> / {totalQuestions}</span> : null}
        </span>
        <QuizCountdown
          totalSeconds={quizEvent.timer_seconds}
          startedAt={startedAt}
          onExpire={handleExpire}
        />
      </div>

      {/* Pregunta */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs font-bold tracking-widest text-rose-400 uppercase mb-3">Pregunta</p>
        <h2 className="text-2xl font-bold text-gray-800 leading-snug">{question.text}</h2>
      </div>

      {/* Opciones */}
      <div className="flex-1 px-5 pb-8 flex flex-col gap-3 justify-start pt-2">
        {['A', 'B', 'C', 'D'].map(opt => {
          const icon = getIcon(opt)
          const isRevealed = revealed && result
          const isCorrect = isRevealed && opt === result.correct_option
          const isWrong = isRevealed && !isCorrect
          const badgeStyle = isCorrect
            ? 'bg-white/30 text-white'
            : isWrong
            ? 'bg-gray-200 text-gray-400'
            : BADGE_COLORS[opt]

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!selected || submitting}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all duration-200 text-left ${getOptionStyle(opt)}`}
            >
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors duration-200 ${badgeStyle}`}>
                {opt}
              </span>
              <span className="flex-1 text-sm font-medium leading-snug">
                {question[`option_${opt.toLowerCase()}`]}
              </span>
              {icon}
            </button>
          )
        })}

      </div>
    </div>
  )
}
