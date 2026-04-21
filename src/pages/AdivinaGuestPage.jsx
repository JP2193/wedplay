import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AdivinaJoinScreen from '../components/adivina/guest/AdivinaJoinScreen'
import AdivinaWaitingRoom from '../components/adivina/guest/AdivinaWaitingRoom'
import AdivinaQuestion from '../components/adivina/guest/AdivinaQuestion'
import AdivinaRankingWait from '../components/adivina/guest/AdivinaRankingWait'
import AdivinaFinalRanking from '../components/adivina/guest/AdivinaFinalRanking'

export default function AdivinaGuestPage() {
  const [player, setPlayer] = useState(null)
  const [adivinaEvent, setAdivinaEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [lastResult, setLastResult] = useState(null)

  // Suscripción a cambios del evento en tiempo real
  useEffect(() => {
    if (!adivinaEvent) return

    const channel = supabase
      .channel(`adivina-event-guest-${adivinaEvent.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'adivina_events', filter: `id=eq.${adivinaEvent.id}` },
        payload => setAdivinaEvent(payload.new)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [adivinaEvent?.id])

  // Cargar preguntas cuando el evento arranca
  useEffect(() => {
    if (!adivinaEvent || adivinaEvent.status === 'lobby' || questions.length > 0) return
    supabase
      .from('adivina_questions')
      .select('*')
      .eq('adivina_event_id', adivinaEvent.id)
      .order('position')
      .then(({ data }) => { if (data) setQuestions(data) })
  }, [adivinaEvent?.status])

  // Resetear lastResult al cambiar de pregunta
  useEffect(() => {
    setLastResult(null)
  }, [adivinaEvent?.current_question_index])

  // Si el juego vuelve a lobby y el jugador fue eliminado (reset), volver al join screen
  useEffect(() => {
    if (!player || !adivinaEvent || adivinaEvent.status !== 'lobby') return
    supabase.from('adivina_players').select('id').eq('id', player.id).maybeSingle()
      .then(({ data }) => { if (!data) setPlayer(null) })
  }, [adivinaEvent?.status])

  // Actualizar total_score del player cuando cambia al ranking
  useEffect(() => {
    if (!player || !adivinaEvent || adivinaEvent.status !== 'ranking') return
    supabase
      .from('adivina_players')
      .select('total_score')
      .eq('id', player.id)
      .single()
      .then(({ data }) => {
        if (data) setPlayer(p => ({ ...p, total_score: data.total_score }))
      })
  }, [adivinaEvent?.status, adivinaEvent?.current_question_index])

  function handleJoined(playerData, eventData) {
    setPlayer(playerData)
    setAdivinaEvent(eventData)
  }

  if (!player || !adivinaEvent) {
    return <AdivinaJoinScreen onJoined={handleJoined} />
  }

  const currentQuestion = questions[adivinaEvent.current_question_index]

  if (adivinaEvent.status === 'lobby') {
    return <AdivinaWaitingRoom player={player} adivinaEvent={adivinaEvent} />
  }

  if (adivinaEvent.status === 'question') {
    if (!currentQuestion) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400 text-sm">Cargando pregunta...</div>
    }
    return <AdivinaQuestion adivinaEvent={adivinaEvent} question={currentQuestion} player={player} onResult={setLastResult} />
  }

  if (adivinaEvent.status === 'ranking') {
    const isLastQuestion = adivinaEvent.current_question_index >= questions.length - 1
    return <AdivinaRankingWait player={player} lastResult={lastResult} adivinaEvent={adivinaEvent} question={currentQuestion} isLastQuestion={isLastQuestion} />
  }

  if (adivinaEvent.status === 'finished') {
    return <AdivinaFinalRanking player={player} adivinaEvent={adivinaEvent} />
  }

  return null
}
