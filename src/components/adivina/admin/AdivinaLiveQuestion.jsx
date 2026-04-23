import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizCountdown from '../../quiz/shared/QuizCountdown'

function PersonPhoto({ photoUrl, name, colorClass }) {
  return (
    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${colorClass} flex items-center justify-center bg-gray-100 shrink-0`}>
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xl">{name[0]?.toUpperCase()}</span>
      )}
    </div>
  )
}

export default function AdivinaLiveQuestion({ adivinaEvent, question, totalPlayers, onTimeUp }) {
  const [answers, setAnswers] = useState([])
  const [expired, setExpired] = useState(false)
  const [revealCountdown, setRevealCountdown] = useState(null) // 5..0 mientras espera revelar
  const expiredRef = useRef(false)
  const mountTimeRef = useRef(new Date().toISOString())

  useEffect(() => {
    mountTimeRef.current = new Date().toISOString()
    setAnswers([])
    setExpired(false)
    setRevealCountdown(null)
    expiredRef.current = false
    fetchAnswers()

    const channel = supabase
      .channel(`adivina-answers-${question.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'adivina_answers', filter: `adivina_question_id=eq.${question.id}` },
        () => fetchAnswers()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [question.id])

  async function fetchAnswers() {
    const { data } = await supabase
      .from('adivina_answers')
      .select('selected_person')
      .eq('adivina_question_id', question.id)
    if (data) setAnswers(data)
  }

  async function handleExpire() {
    if (expiredRef.current) return
    expiredRef.current = true
    setExpired(true)

    // Esperar 5 segundos sincronizados con el countdown visual de display/mobile
    let c = 5
    setRevealCountdown(c)
    await new Promise(resolve => {
      const id = setInterval(() => {
        c -= 1
        setRevealCountdown(c)
        if (c <= 0) { clearInterval(id); resolve() }
      }, 1000)
    })

    await supabase.rpc('advance_adivina_state', {
      p_adivina_event_id: adivinaEvent.id,
      p_new_status: 'ranking',
    })
    onTimeUp()
  }

  const count1 = answers.filter(a => a.selected_person === 1).length
  const count2 = answers.filter(a => a.selected_person === 2).length
  const pct1 = totalPlayers > 0 ? (count1 / totalPlayers) * 100 : 0
  const pct2 = totalPlayers > 0 ? (count2 / totalPlayers) * 100 : 0
  const isCorrect1 = question.correct_person === 1
  const isCorrect2 = question.correct_person === 2

  return (
    <div className="space-y-5">
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            Pregunta {adivinaEvent.current_question_index + 1}
          </span>
          <QuizCountdown
            totalSeconds={adivinaEvent.timer_seconds}
            startedAt={mountTimeRef.current}
            onExpire={handleExpire}
          />
        </div>
        <p className="text-xl font-semibold text-gray-800">{question.text}</p>
        <p className="text-xs text-gray-400">{answers.length} / {totalPlayers} respondieron</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Persona 1 */}
        <div className={`card py-3 relative overflow-hidden ${expired && isCorrect1 ? 'ring-2 ring-emerald-400' : ''}`}>
          <div
            className="absolute inset-y-0 left-0 bg-blue-200 opacity-30 transition-all duration-500"
            style={{ width: `${pct1}%` }}
          />
          <div className="relative flex items-center gap-2">
            <PersonPhoto
              photoUrl={adivinaEvent.person1_photo_url}
              name={adivinaEvent.person1_name}
              colorClass="border-blue-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">{adivinaEvent.person1_name}</p>
              <p className="text-lg font-bold text-blue-600">{count1}</p>
            </div>
            {expired && isCorrect1 && <span className="text-emerald-500 text-sm">✓</span>}
          </div>
        </div>

        {/* Persona 2 */}
        <div className={`card py-3 relative overflow-hidden ${expired && isCorrect2 ? 'ring-2 ring-emerald-400' : ''}`}>
          <div
            className="absolute inset-y-0 left-0 bg-rose-200 opacity-30 transition-all duration-500"
            style={{ width: `${pct2}%` }}
          />
          <div className="relative flex items-center gap-2">
            <PersonPhoto
              photoUrl={adivinaEvent.person2_photo_url}
              name={adivinaEvent.person2_name}
              colorClass="border-rose-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">{adivinaEvent.person2_name}</p>
              <p className="text-lg font-bold text-rose-500">{count2}</p>
            </div>
            {expired && isCorrect2 && <span className="text-emerald-500 text-sm">✓</span>}
          </div>
        </div>
      </div>

      {!expired && (
        <button onClick={handleExpire} className="btn-secondary w-full text-sm">
          Cerrar pregunta ahora
        </button>
      )}
      {expired && revealCountdown !== null && revealCountdown > 0 && (
        <div className="card text-center py-4 space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Revelando en</p>
          <p className="text-4xl font-black text-amber-500 tabular-nums">{revealCountdown}</p>
        </div>
      )}
      {expired && revealCountdown === 0 && (
        <div className="card text-center py-3">
          <p className="text-sm font-semibold text-emerald-600">✓ Respuesta revelada</p>
        </div>
      )}
    </div>
  )
}
