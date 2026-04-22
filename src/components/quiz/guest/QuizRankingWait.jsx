import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const OPTIONS = ['A', 'B', 'C', 'D']

export default function QuizRankingWait({ player, lastResult, question, isLastQuestion }) {
  const [voteCounts, setVoteCounts] = useState(null)
  const [animating, setAnimating] = useState(false)

  const didAnswer = lastResult !== null
  const isCorrect = lastResult?.is_correct
  const correctOption = lastResult?.correct_option

  const correctText = correctOption && question
    ? question[`option_${correctOption.toLowerCase()}`]
    : null

  useEffect(() => {
    if (!question) return
    supabase
      .from('quiz_answers')
      .select('selected_option')
      .eq('quiz_question_id', question.id)
      .then(({ data }) => {
        if (!data) return
        const counts = { A: 0, B: 0, C: 0, D: 0 }
        data.forEach(r => { if (counts[r.selected_option] !== undefined) counts[r.selected_option]++ })
        setVoteCounts(counts)
        // Trigger bar animation after a short delay
        setTimeout(() => setAnimating(true), 100)
      })
  }, [question?.id])

  const total = voteCounts ? Object.values(voteCounts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">

        {/* Verdict badge */}
        <div className="text-center space-y-2">
          {didAnswer ? (
            <>
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm
                ${isCorrect
                  ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                  : 'bg-red-500/20 border border-red-400/50 text-red-300'
                }`}>
                <span className="text-lg">{isCorrect ? '✅' : '❌'}</span>
                {isCorrect ? '¡Acertaste!' : 'Incorrecto'}
              </div>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-white/10 border border-white/20 text-white/60">
              <span className="text-lg">⏰</span>
              No respondiste a tiempo
            </div>
          )}
        </div>

        {/* Correct answer highlight */}
        {correctText && (
          <div className="bg-emerald-500/15 border border-emerald-400/30 rounded-2xl px-5 py-3.5 flex items-start gap-3">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-emerald-400 text-[0.7rem] font-bold uppercase tracking-widest">Respuesta correcta</p>
              <p className="text-white font-semibold text-base mt-0.5">{correctText}</p>
            </div>
          </div>
        )}

        {/* Vote breakdown */}
        {question && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <p className="text-white/40 text-[0.65rem] font-bold uppercase tracking-widest text-center">Respuestas del grupo</p>
            {OPTIONS.map(key => {
              const optText = question[`option_${key.toLowerCase()}`]
              if (!optText) return null
              const count = voteCounts?.[key] ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const isCorrectOpt = key === correctOption

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0
                      ${isCorrectOpt ? 'bg-emerald-500' : 'bg-red-500/60'}`}>
                      {key}
                    </span>
                    <span className={`flex-1 text-sm truncate font-medium ${isCorrectOpt ? 'text-white' : 'text-white/50'}`}>
                      {optText}
                    </span>
                    <span className={`text-sm font-bold tabular-nums ${isCorrectOpt ? 'text-emerald-400' : 'text-white/30'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out
                        ${isCorrectOpt ? 'bg-emerald-500' : 'bg-red-500/50'}`}
                      style={{ width: animating ? `${pct}%` : '0%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Score + waiting */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-5 py-3">
            <span className="text-white/50 text-sm">Puntaje</span>
            <span className="text-white font-black text-xl tabular-nums">
              {player.total_score?.toLocaleString() ?? 0}
            </span>
            <span className="text-white/40 text-xs">pts</span>
          </div>
          <p className="text-white/30 text-xs animate-pulse tracking-wide">
            {isLastQuestion ? 'Calculando resultados finales...' : 'Esperá la siguiente pregunta...'}
          </p>
        </div>
      </div>

      {/* Decorative dots */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-10 right-8 w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute top-24 left-12 w-1.5 h-1.5 bg-purple-300/30 rounded-full" />
        <div className="absolute bottom-20 right-6 w-1.5 h-1.5 bg-purple-200/20 rounded-full" />
      </div>
    </div>
  )
}
