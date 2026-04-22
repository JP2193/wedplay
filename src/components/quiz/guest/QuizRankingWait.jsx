import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const OPTION_COLORS = {
  A: 'bg-indigo-500',
  B: 'bg-amber-500',
  C: 'bg-rose-500',
  D: 'bg-emerald-500',
}

export default function QuizRankingWait({ player, lastResult, question, isLastQuestion }) {
  const [voteCounts, setVoteCounts] = useState(null)

  const didAnswer = lastResult !== null
  const isCorrect = lastResult?.is_correct
  const correctOption = lastResult?.correct_option

  const correctOptionKey = correctOption ? `option_${correctOption.toLowerCase()}` : null
  const correctText = correctOptionKey && question ? question[correctOptionKey] : null

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
      })
  }, [question?.id])

  const total = voteCounts ? Object.values(voteCounts).reduce((a, b) => a + b, 0) : 0

  const icon = !didAnswer ? '⏰' : isCorrect ? '✅' : '❌'
  const verdict = !didAnswer
    ? 'No respondiste a tiempo'
    : isCorrect
      ? '¡Acertaste!'
      : 'Incorrecto'
  const verdictColor = isCorrect ? 'text-emerald-400' : !didAnswer ? 'text-gray-300' : 'text-red-400'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="text-center space-y-5 max-w-sm w-full">

        {/* Verdict */}
        <div className="text-5xl">{icon}</div>
        <p className={`text-2xl font-bold ${verdictColor}`}>{verdict}</p>

        {/* Correct answer */}
        {correctText && (
          <div className="bg-white/10 rounded-2xl px-5 py-3 space-y-1">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Respuesta correcta</p>
            <p className="text-white font-semibold text-base">{correctText}</p>
          </div>
        )}

        {/* Vote breakdown */}
        {question && (
          <div className="space-y-2 text-left">
            {['A', 'B', 'C', 'D'].map(opt => {
              const optText = question[`option_${opt.toLowerCase()}`]
              if (!optText) return null
              const count = voteCounts?.[opt] ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const isCorrectOpt = opt === correctOption

              return (
                <div key={opt} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${isCorrectOpt ? 'bg-emerald-500' : 'bg-white/20'}`}>
                        {opt}
                      </span>
                      <span className={`text-sm truncate ${isCorrectOpt ? 'text-white font-semibold' : 'text-gray-400'}`}>
                        {optText}
                      </span>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${isCorrectOpt ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCorrectOpt ? 'bg-emerald-500' : OPTION_COLORS[opt]} opacity-70`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Score + waiting */}
        <div className="border-t border-white/10 pt-4 space-y-1">
          <p className="text-gray-500 text-sm">
            Puntaje:{' '}
            <span className="text-white font-bold">{player.total_score?.toLocaleString() ?? 0} pts</span>
          </p>
          <p className="text-gray-400 text-xs animate-pulse">
            {isLastQuestion ? 'Esperando resultados finales...' : 'Esperá la siguiente pregunta...'}
          </p>
        </div>
      </div>
    </div>
  )
}
