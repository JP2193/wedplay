import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AdivinaRankingWait({ player, lastResult, adivinaEvent, question, isLastQuestion }) {
  const [voteCounts, setVoteCounts] = useState(null)
  const [animating, setAnimating] = useState(false)

  const didAnswer = lastResult !== null
  const isCorrect = lastResult?.is_correct
  const correctPerson = lastResult?.correct_person

  const correctName = correctPerson === 1 ? adivinaEvent.person1_name : adivinaEvent.person2_name
  const correctPhoto = correctPerson === 1 ? adivinaEvent.person1_photo_url : adivinaEvent.person2_photo_url

  useEffect(() => {
    if (!question) return
    supabase
      .from('adivina_answers')
      .select('selected_person')
      .eq('adivina_question_id', question.id)
      .then(({ data }) => {
        if (!data) return
        const counts = { 1: 0, 2: 0 }
        data.forEach(r => { if (r.selected_person === 1 || r.selected_person === 2) counts[r.selected_person]++ })
        setVoteCounts(counts)
        setTimeout(() => setAnimating(true), 150)
      })
  }, [question?.id])

  const total = voteCounts ? (voteCounts[1] + voteCounts[2]) : 0

  const persons = [
    { person: 1, name: adivinaEvent.person1_name, photo: adivinaEvent.person1_photo_url },
    { person: 2, name: adivinaEvent.person2_name, photo: adivinaEvent.person2_photo_url },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">

        {/* Veredicto */}
        <div className="text-center">
          {!didAnswer ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-white/10 border border-white/20 text-white/60">
              <span>⏰</span> No respondiste a tiempo
            </div>
          ) : isCorrect ? (
            <div className="inline-flex items-center gap-2.5 bg-emerald-500 px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white font-black text-lg">¡Acertaste!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2.5 bg-red-500 px-6 py-3 rounded-2xl shadow-lg shadow-red-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-white font-black text-lg">Incorrecto</span>
            </div>
          )}
        </div>

        {/* Respuesta correcta — foto + nombre */}
        {correctName && (
          <div className="bg-white/8 border border-white/15 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/20 shrink-0">
              {correctPhoto
                ? <img src={correctPhoto} alt={correctName} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{correctName[0]?.toUpperCase()}</span>
                  </div>
              }
            </div>
            <div>
              <p className="text-white/40 text-[0.65rem] font-bold uppercase tracking-widest">Respuesta correcta</p>
              <p className="text-white font-semibold text-base mt-0.5">{correctName}</p>
            </div>
          </div>
        )}

        {/* Votos del grupo */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-white/30 text-[0.65rem] font-bold uppercase tracking-widest text-center">Respuestas del grupo</p>
          {persons.map(({ person, name, photo }) => {
            const count = voteCounts?.[person] ?? 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const isCorrectP = person === correctPerson

            return (
              <div key={person} className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg overflow-hidden border shrink-0
                    ${isCorrectP ? 'border-emerald-400/60' : 'border-white/10'}`}>
                    {photo
                      ? <img src={photo} alt={name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{name[0]?.toUpperCase()}</span>
                        </div>
                    }
                  </div>
                  <span className={`flex-1 text-sm font-medium truncate ${isCorrectP ? 'text-white' : 'text-white/30'}`}>
                    {name}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${isCorrectP ? 'text-emerald-400' : 'text-white/20'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out
                      ${isCorrectP ? 'bg-emerald-500' : 'bg-white/20'}`}
                    style={{ width: animating ? `${pct}%` : '0%' }}
                  />
                </div>
              </div>
            )
          })}
        </div>

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
        <div className="absolute top-10 right-8 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute bottom-20 right-6 w-1.5 h-1.5 bg-purple-200/15 rounded-full" />
      </div>
    </div>
  )
}
