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
        setTimeout(() => setAnimating(true), 150)
      })
  }, [question?.id])

  const total = voteCounts ? Object.values(voteCounts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">

        {/* Verdict — muy diferenciado entre acertaste e incorrecto */}
        <div className="text-center">
          {!didAnswer ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-white/10 border border-white/20 text-white/60">
              <span>⏰</span> No respondiste a tiempo
            </div>
          ) : isCorrect ? (
            /* Acertaste: verde, grande, celebratorio */
            <div className="inline-flex items-center gap-2.5 bg-emerald-500 px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white font-black text-lg">¡Acertaste!</span>
            </div>
          ) : (
            /* Incorrecto: rojo sólido, grande, claro */
            <div className="inline-flex items-center gap-2.5 bg-red-500 px-6 py-3 rounded-2xl shadow-lg shadow-red-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-white font-black text-lg">Incorrecto</span>
            </div>
          )}
        </div>

        {/* Respuesta correcta — neutral, sin color que confunda */}
        {correctText && (
          <div className="bg-white/8 border border-white/15 rounded-2xl px-5 py-3.5">
            <p className="text-white/40 text-[0.65rem] font-bold uppercase tracking-widest mb-1">
              Respuesta correcta
            </p>
            <p className="text-white font-semibold text-base">{correctText}</p>
          </div>
        )}

        {/* Respuestas del grupo — correcta en verde, incorrectas grises/apagadas */}
        {question && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <p className="text-white/30 text-[0.65rem] font-bold uppercase tracking-widest text-center">
              Respuestas del grupo
            </p>
            {OPTIONS.map(key => {
              const optText = question[`option_${key.toLowerCase()}`]
              if (!optText) return null
              const count = voteCounts?.[key] ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const isCorrectOpt = key === correctOption

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0
                      ${isCorrectOpt
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-white/30'
                      }`}>
                      {key}
                    </span>
                    <span className={`flex-1 text-sm truncate font-medium
                      ${isCorrectOpt ? 'text-white' : 'text-white/30'}`}>
                      {optText}
                    </span>
                    <span className={`text-sm font-bold tabular-nums
                      ${isCorrectOpt ? 'text-emerald-400' : 'text-white/20'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out
                        ${isCorrectOpt ? 'bg-emerald-500' : 'bg-white/20'}`}
                      style={{ width: animating ? `${pct}%` : '0%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Puntaje + espera */}
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

      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-10 right-8 w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute top-24 left-12 w-1.5 h-1.5 bg-purple-300/20 rounded-full" />
        <div className="absolute bottom-20 right-6 w-1.5 h-1.5 bg-purple-200/15 rounded-full" />
      </div>
    </div>
  )
}
