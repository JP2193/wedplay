import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizCountdown from '../shared/QuizCountdown'

const OPTIONS = [
  { key: 'A', bg: 'from-indigo-500 to-indigo-600', glow: 'shadow-indigo-500/40', border: 'border-indigo-400', ring: 'ring-indigo-400' },
  { key: 'B', bg: 'from-amber-400 to-amber-500',   glow: 'shadow-amber-400/40',  border: 'border-amber-400',  ring: 'ring-amber-400'  },
  { key: 'C', bg: 'from-rose-500 to-rose-600',     glow: 'shadow-rose-500/40',   border: 'border-rose-400',   ring: 'ring-rose-400'   },
  { key: 'D', bg: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/40', border: 'border-emerald-400', ring: 'ring-emerald-400' },
]

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

  function getCardState(opt) {
    const cfg = OPTIONS.find(o => o.key === opt)
    if (!selected) return { cls: 'bg-white/10 border border-white/20 text-white active:scale-[0.97]', badge: cfg.bg, icon: null }

    if (revealed && result) {
      if (opt === result.correct_option) {
        return {
          cls: `bg-emerald-500 border-2 border-emerald-300 text-white shadow-lg shadow-emerald-500/50`,
          badge: 'from-white/30 to-white/20',
          icon: <CheckIcon />
        }
      }
      if (opt === selected && !result.is_correct) {
        return {
          cls: 'bg-red-500/20 border border-red-400/50 text-red-300',
          badge: 'from-red-500/40 to-red-600/40',
          icon: <CrossIcon />
        }
      }
      return { cls: 'bg-white/5 border border-white/10 text-white/30', badge: 'from-white/10 to-white/10', icon: null }
    }

    // Selected, not revealed yet
    if (opt === selected) {
      return {
        cls: `bg-gradient-to-r ${cfg.bg} border-2 border-white/40 text-white shadow-lg ${cfg.glow}`,
        badge: 'from-white/30 to-white/20',
        icon: <CheckmarkPending />
      }
    }
    return { cls: 'bg-white/5 border border-white/10 text-white/40', badge: 'from-white/10 to-white/10', icon: null }
  }

  const startedAt = quizEvent.question_started_at || mountTimeRef.current
  const questionNumber = (quizEvent.current_question_index ?? 0) + 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col">

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs font-bold tracking-widest uppercase">Pregunta</span>
          <span className="text-white/60 text-sm font-semibold tabular-nums">
            {questionNumber}
            <span className="text-white/30"> / {totalQuestions || '?'}</span>
          </span>
        </div>
        <QuizCountdown
          totalSeconds={quizEvent.timer_seconds}
          startedAt={startedAt}
          onExpire={handleExpire}
        />
      </div>

      {/* Question */}
      <div className="px-5 pt-2 pb-5">
        <div className="bg-white/5 rounded-3xl border border-white/10 px-5 py-5 shadow-inner">
          <h2 className="text-white text-[1.45rem] font-bold leading-snug">
            {question.text}
          </h2>
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 px-5 pb-8 flex flex-col gap-3">
        {OPTIONS.map(({ key }) => {
          const val = question[`option_${key.toLowerCase()}`]
          if (!val) return null
          const { cls, badge, icon } = getCardState(key)

          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={!!selected || submitting}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-200 text-left ${cls}`}
            >
              <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badge} flex items-center justify-center text-sm font-black text-white shrink-0 transition-all duration-200`}>
                {key}
              </span>
              <span className="flex-1 text-[0.95rem] font-semibold leading-snug">
                {val}
              </span>
              {icon && <span className="shrink-0">{icon}</span>}
            </button>
          )
        })}
      </div>

      {/* Stars decorativas */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-10 right-8 w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute top-24 left-12 w-1.5 h-1.5 bg-purple-300/30 rounded-full" />
        <div className="absolute top-40 right-16 w-1 h-1 bg-indigo-300/40 rounded-full" />
        <div className="absolute bottom-32 left-8 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute bottom-20 right-6 w-1.5 h-1.5 bg-purple-200/20 rounded-full" />
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg className="w-5 h-5 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CheckmarkPending() {
  return (
    <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}
