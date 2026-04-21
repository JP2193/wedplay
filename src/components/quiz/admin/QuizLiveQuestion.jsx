import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizCountdown from '../shared/QuizCountdown'

const OPTION_COLORS = { A: 'bg-blue-100 text-blue-700', B: 'bg-amber-100 text-amber-700', C: 'bg-rose-100 text-rose-700', D: 'bg-emerald-100 text-emerald-700' }

export default function QuizLiveQuestion({ quizEvent, question, totalPlayers, onTimeUp }) {
  const [answers, setAnswers] = useState([])
  const [expired, setExpired] = useState(false)
  const expiredRef = useRef(false)

  useEffect(() => {
    setAnswers([])
    setExpired(false)
    expiredRef.current = false
    fetchAnswers()

    const channel = supabase
      .channel(`quiz-answers-${question.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_answers', filter: `quiz_question_id=eq.${question.id}` },
        () => fetchAnswers()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [question.id])

  async function fetchAnswers() {
    const { data } = await supabase
      .from('quiz_answers')
      .select('selected_option')
      .eq('quiz_question_id', question.id)
    if (data) setAnswers(data)
  }

  async function handleExpire() {
    if (expiredRef.current) return
    expiredRef.current = true
    setExpired(true)
    await supabase.rpc('advance_quiz_state', {
      p_quiz_event_id: quizEvent.id,
      p_new_status: 'ranking',
    })
    onTimeUp()
  }

  const countFor = (opt) => answers.filter(a => a.selected_option === opt).length

  return (
    <div className="space-y-5">
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            Pregunta {quizEvent.current_question_index + 1}
          </span>
          <QuizCountdown
            totalSeconds={quizEvent.timer_seconds}
            startedAt={quizEvent.question_started_at}
            onExpire={handleExpire}
          />
        </div>
        <p className="text-xl font-semibold text-gray-800">{question.text}</p>
        <p className="text-xs text-gray-400">{answers.length} / {totalPlayers} respondieron</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {['A','B','C','D'].map(opt => {
          const count = countFor(opt)
          const pct = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0
          const isCorrect = question.correct_option === opt
          return (
            <div key={opt} className={`card py-3 relative overflow-hidden ${expired && isCorrect ? 'ring-2 ring-emerald-400' : ''}`}>
              <div
                className={`absolute inset-y-0 left-0 opacity-30 transition-all duration-500 ${OPTION_COLORS[opt].split(' ')[0]}`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm px-2 py-0.5 rounded ${OPTION_COLORS[opt]}`}>{opt}</span>
                  <span className="text-sm text-gray-700 truncate max-w-[100px]">{question[`option_${opt.toLowerCase()}`]}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-700">{count}</span>
                  {expired && isCorrect && <span className="ml-1 text-emerald-500 text-xs">✓</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!expired && (
        <button
          onClick={handleExpire}
          className="btn-secondary w-full text-sm"
        >
          Cerrar pregunta ahora
        </button>
      )}
    </div>
  )
}
