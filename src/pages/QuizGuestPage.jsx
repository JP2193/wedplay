import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import QuizJoinScreen from '../components/quiz/guest/QuizJoinScreen'
import QuizWaitingRoom from '../components/quiz/guest/QuizWaitingRoom'
import QuizQuestion from '../components/quiz/guest/QuizQuestion'
import QuizRankingWait from '../components/quiz/guest/QuizRankingWait'
import QuizFinalRanking from '../components/quiz/guest/QuizFinalRanking'

export default function QuizGuestPage() {
  const [player, setPlayer] = useState(null)
  const [quizEvent, setQuizEvent] = useState(null)
  const [questions, setQuestions] = useState([])

  // Suscripción a cambios del evento en tiempo real
  useEffect(() => {
    if (!quizEvent) return

    const channel = supabase
      .channel(`quiz-event-guest-${quizEvent.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quiz_events', filter: `id=eq.${quizEvent.id}` },
        payload => setQuizEvent(payload.new)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [quizEvent?.id])

  // Cargar preguntas cuando el evento arranca
  useEffect(() => {
    if (!quizEvent || quizEvent.status === 'lobby' || questions.length > 0) return
    supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_event_id', quizEvent.id)
      .order('position')
      .then(({ data }) => { if (data) setQuestions(data) })
  }, [quizEvent?.status])

  // Actualizar total_score del player cuando cambia el ranking
  useEffect(() => {
    if (!player || !quizEvent || quizEvent.status !== 'ranking') return
    supabase
      .from('quiz_players')
      .select('total_score')
      .eq('id', player.id)
      .single()
      .then(({ data }) => {
        if (data) setPlayer(p => ({ ...p, total_score: data.total_score }))
      })
  }, [quizEvent?.status, quizEvent?.current_question_index])

  function handleJoined(playerData, eventData) {
    setPlayer(playerData)
    setQuizEvent(eventData)
  }

  if (!player || !quizEvent) {
    return <QuizJoinScreen onJoined={handleJoined} />
  }

  const currentQuestion = questions[quizEvent.current_question_index]

  if (quizEvent.status === 'lobby') {
    return <QuizWaitingRoom player={player} quizEvent={quizEvent} />
  }

  if (quizEvent.status === 'question') {
    if (!currentQuestion) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400 text-sm">Cargando pregunta...</div>
    }
    return <QuizQuestion quizEvent={quizEvent} question={currentQuestion} player={player} />
  }

  if (quizEvent.status === 'ranking') {
    return <QuizRankingWait player={player} />
  }

  if (quizEvent.status === 'finished') {
    return <QuizFinalRanking player={player} quizEvent={quizEvent} />
  }

  return null
}
