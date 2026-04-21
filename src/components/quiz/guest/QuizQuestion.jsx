import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizCountdown from '../shared/QuizCountdown'

const OPTION_STYLES = {
  A: { base: 'bg-blue-500 hover:bg-blue-600 text-white', correct: 'bg-emerald-500 text-white', wrong: 'bg-red-400 text-white', neutral: 'bg-blue-100 text-blue-400' },
  B: { base: 'bg-amber-500 hover:bg-amber-600 text-white', correct: 'bg-emerald-500 text-white', wrong: 'bg-red-400 text-white', neutral: 'bg-amber-100 text-amber-400' },
  C: { base: 'bg-rose-500 hover:bg-rose-600 text-white', correct: 'bg-emerald-500 text-white', wrong: 'bg-red-400 text-white', neutral: 'bg-rose-100 text-rose-400' },
  D: { base: 'bg-emerald-500 hover:bg-emerald-600 text-white', correct: 'bg-emerald-500 text-white', wrong: 'bg-red-400 text-white', neutral: 'bg-emerald-100 text-emerald-400' },
}

export default function QuizQuestion({ quizEvent, question, player, onResult }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const answeredRef = useRef(false)

  useEffect(() => {
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

    const timeTakenMs = Date.now() - new Date(quizEvent.question_started_at).getTime()

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

  function getStyle(opt) {
    if (!selected) return OPTION_STYLES[opt].base
    if (!revealed) {
      if (selected === opt) return OPTION_STYLES[opt].base + ' opacity-70'
      return OPTION_STYLES[opt].neutral
    }
    // revealed
    if (result) {
      if (opt === result.correct_option) return OPTION_STYLES[opt].correct
      if (opt === selected && !result.is_correct) return OPTION_STYLES[opt].wrong
    }
    return OPTION_STYLES[opt].neutral
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-gray-400 text-sm">{player.full_name}</span>
        <QuizCountdown
          totalSeconds={quizEvent.timer_seconds}
          startedAt={quizEvent.question_started_at}
          onExpire={handleExpire}
        />
        <span className="text-gray-400 text-sm">#{quizEvent.current_question_index + 1}</span>
      </div>

      {/* Pregunta */}
      <div className="flex-1 flex flex-col justify-center px-5 gap-6">
        <div className="bg-white/10 rounded-2xl p-6 text-center">
          <p className="text-white text-xl font-semibold leading-snug">{question.text}</p>
        </div>

        {/* Opciones */}
        <div className="grid grid-cols-2 gap-3">
          {['A','B','C','D'].map(opt => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!selected || submitting}
              className={`rounded-2xl py-5 px-3 font-bold text-sm transition-all active:scale-95 ${getStyle(opt)}`}
            >
              <span className="block text-xs font-medium opacity-80 mb-1">{opt}</span>
              {question[`option_${opt.toLowerCase()}`]}
            </button>
          ))}
        </div>

        {/* Feedback — solo visible tras revelar */}
        {revealed && result && (
          <div className={`rounded-2xl p-4 text-center space-y-1 ${result.is_correct ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <p className={`text-lg font-bold ${result.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.is_correct ? '¡Correcto! 🎉' : 'Incorrecto 😔'}
            </p>
            {result.is_correct && (
              <p className="text-white/70 text-sm">
                +{result.base_score} base {result.speed_bonus > 0 && `+${result.speed_bonus} velocidad`}
                <span className="font-bold text-white"> = {result.total_score} pts</span>
              </p>
            )}
          </div>
        )}

        {selected && !result && (
          <div className="text-center text-gray-400 text-sm animate-pulse">Guardando...</div>
        )}
      </div>
    </div>
  )
}
