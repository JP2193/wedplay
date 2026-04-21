import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizCountdown from '../../quiz/shared/QuizCountdown'

export default function AdivinaQuestion({ adivinaEvent, question, player, onResult }) {
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

  async function handleSelect(person) {
    if (answeredRef.current || submitting) return
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

    if (!error && data) {
      setResult(data)
      onResult?.(data)
    }
    setSubmitting(false)
  }

  function handleExpire() {
    setRevealed(true)
  }

  function getStyle(person) {
    const isP1 = person === 1
    const baseClass = isP1
      ? 'bg-blue-500 hover:bg-blue-600 active:scale-95'
      : 'bg-rose-500 hover:bg-rose-600 active:scale-95'
    const neutralClass = isP1 ? 'bg-blue-100' : 'bg-rose-100'

    if (!selected) return baseClass
    if (!revealed) {
      if (selected === person) return baseClass + ' opacity-70'
      return neutralClass
    }
    // revealed
    if (result) {
      if (person === result.correct_person) return 'bg-emerald-500 ring-4 ring-emerald-300'
      if (person === selected && !result.is_correct) return 'bg-red-400'
    }
    return neutralClass
  }

  const person1 = {
    name: adivinaEvent.person1_name,
    photo: adivinaEvent.person1_photo_url,
  }
  const person2 = {
    name: adivinaEvent.person2_name,
    photo: adivinaEvent.person2_photo_url,
  }

  function PersonButton({ person, personData }) {
    const style = getStyle(person)
    return (
      <button
        onClick={() => handleSelect(person)}
        disabled={!!selected || submitting}
        className={`flex-1 rounded-3xl py-6 px-4 flex flex-col items-center gap-3 font-bold transition-all ${style}`}
      >
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/40 bg-white/20 flex items-center justify-center">
          {personData.photo ? (
            <img src={personData.photo} alt={personData.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-white">{personData.name[0]?.toUpperCase()}</span>
          )}
        </div>
        <span className="text-white text-base font-semibold">{personData.name}</span>
        {revealed && result && person === result.correct_person && (
          <span className="text-white text-xl">✓</span>
        )}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-gray-400 text-sm">{player.full_name}</span>
        <QuizCountdown
          totalSeconds={adivinaEvent.timer_seconds}
          startedAt={mountTimeRef.current}
          onExpire={handleExpire}
        />
        <span className="text-gray-400 text-sm">#{adivinaEvent.current_question_index + 1}</span>
      </div>

      {/* Pregunta */}
      <div className="flex-1 flex flex-col justify-center px-5 gap-6">
        <div className="bg-white/10 rounded-2xl p-6 text-center">
          <p className="text-white text-xl font-semibold leading-snug">{question.text}</p>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <PersonButton person={1} personData={person1} />
          <PersonButton person={2} personData={person2} />
        </div>

        {selected && !result && (
          <div className="text-center text-gray-400 text-sm animate-pulse">Guardando...</div>
        )}
      </div>
    </div>
  )
}
