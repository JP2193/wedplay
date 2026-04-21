import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizRankingTable from '../../quiz/shared/QuizRankingTable'

export default function AdivinaLiveRanking({ adivinaEvent, totalQuestions, onNext, onFinish }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)

  const isLast = adivinaEvent.current_question_index >= totalQuestions - 1

  useEffect(() => { fetchPlayers() }, [adivinaEvent.current_question_index])

  async function fetchPlayers() {
    const { data } = await supabase
      .from('adivina_players')
      .select('id, full_name, total_score')
      .eq('adivina_event_id', adivinaEvent.id)
      .order('total_score', { ascending: false })
    if (data) setPlayers(data)
    setLoading(false)
  }

  async function handleNext() {
    setAdvancing(true)
    const nextIndex = adivinaEvent.current_question_index + 1
    await supabase.rpc('advance_adivina_state', {
      p_adivina_event_id: adivinaEvent.id,
      p_new_status: 'question',
      p_question_index: nextIndex,
    })
    onNext()
    setAdvancing(false)
  }

  async function handleFinish() {
    setAdvancing(true)
    await supabase.rpc('advance_adivina_state', {
      p_adivina_event_id: adivinaEvent.id,
      p_new_status: 'finished',
    })
    onFinish()
    setAdvancing(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">
          Ranking — Pregunta {adivinaEvent.current_question_index + 1} de {totalQuestions}
        </h3>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-6 text-sm">Cargando...</div>
      ) : (
        <QuizRankingTable players={players} />
      )}

      <div className="pt-2">
        {isLast ? (
          <button onClick={handleFinish} disabled={advancing} className="btn-primary w-full py-4 text-base">
            {advancing ? '...' : '🏁 Ver ranking final'}
          </button>
        ) : (
          <button onClick={handleNext} disabled={advancing} className="btn-primary w-full py-4 text-base">
            {advancing ? '...' : `▶ Siguiente pregunta (${adivinaEvent.current_question_index + 2}/${totalQuestions})`}
          </button>
        )}
      </div>
    </div>
  )
}
