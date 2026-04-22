import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName } from '../lib/rooms'
import QuizWaitingRoom from '../components/quiz/guest/QuizWaitingRoom'
import QuizQuestion from '../components/quiz/guest/QuizQuestion'
import QuizRankingWait from '../components/quiz/guest/QuizRankingWait'
import QuizFinalRanking from '../components/quiz/guest/QuizFinalRanking'

const TOKEN_KEY = (eventId, fullName) => `quiz-token-${eventId}-${fullName}`

function getOrCreateToken(eventId, fullName) {
  const key = TOKEN_KEY(eventId, fullName)
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const token = crypto.randomUUID()
  localStorage.setItem(key, token)
  return token
}

export default function QuizRoomGuestPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [quizEvent, setQuizEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initGame()
  }, [code])

  async function initGame() {
    const guestName = getGuestName(code)
    if (!guestName) { navigate(`/${code}?redirect=quiz`, { replace: true }); return }

    const room = await getRoomByCode(code)
    if (!room) { navigate('/', { replace: true }); return }

    const { data: event } = await supabase
      .from('quiz_events')
      .select('*')
      .eq('room_id', room.id)
      .maybeSingle()

    if (!event) {
      setError('El Quiz todavía no está configurado. Volvé más tarde.')
      setLoading(false)
      return
    }

    if (event.status === 'finished') {
      setError('El Quiz ya finalizó.')
      setLoading(false)
      return
    }

    const sessionToken = getOrCreateToken(event.id, guestName)

    const { data: existing } = await supabase
      .from('quiz_players')
      .select('*')
      .eq('quiz_event_id', event.id)
      .eq('full_name', guestName)
      .maybeSingle()

    if (existing) {
      setPlayer({ ...existing, _sessionToken: sessionToken })
      setQuizEvent(event)
      setLoading(false)
      return
    }

    const { data: newPlayer, error: insertError } = await supabase
      .from('quiz_players')
      .insert({ quiz_event_id: event.id, full_name: guestName, session_token: sessionToken })
      .select()
      .single()

    if (insertError) {
      setError('Error al unirte al quiz. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setPlayer({ ...newPlayer, _sessionToken: sessionToken })
    setQuizEvent(event)
    setLoading(false)
  }

  // Real-time event updates
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

  // Load questions when game starts
  useEffect(() => {
    if (!quizEvent || quizEvent.status === 'lobby' || questions.length > 0) return
    supabase.from('quiz_questions').select('*')
      .eq('quiz_event_id', quizEvent.id).order('position')
      .then(({ data }) => { if (data) setQuestions(data) })
  }, [quizEvent?.status])

  useEffect(() => { setLastResult(null) }, [quizEvent?.current_question_index])

  // If reset, check if player still exists
  useEffect(() => {
    if (!player || !quizEvent || quizEvent.status !== 'lobby') return
    supabase.from('quiz_players').select('id').eq('id', player.id).maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setPlayer(null)
          setQuestions([])
          initGame()
        }
      })
  }, [quizEvent?.status])

  // Sync player score during ranking
  useEffect(() => {
    if (!player || !quizEvent || quizEvent.status !== 'ranking') return
    supabase.from('quiz_players').select('total_score').eq('id', player.id).single()
      .then(({ data }) => { if (data) setPlayer(p => ({ ...p, total_score: data.total_score })) })
  }, [quizEvent?.status, quizEvent?.current_question_index])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center gap-4">
        <div className="text-5xl">😕</div>
        <p className="text-gray-600 text-sm">{error}</p>
        <button onClick={() => navigate(`/${code}`)} className="btn-ghost text-sm">← Volver al lobby</button>
      </div>
    )
  }

  if (!player || !quizEvent) return null

  const currentQuestion = questions[quizEvent.current_question_index]

  if (quizEvent.status === 'lobby') {
    return <QuizWaitingRoom player={player} quizEvent={quizEvent} />
  }
  if (quizEvent.status === 'question') {
    if (!currentQuestion) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400 text-sm">Cargando pregunta...</div>
    return <QuizQuestion quizEvent={quizEvent} question={currentQuestion} player={player} onResult={setLastResult} totalQuestions={questions.length} />
  }
  if (quizEvent.status === 'ranking') {
    const isLastQuestion = quizEvent.current_question_index >= questions.length - 1
    return <QuizRankingWait player={player} lastResult={lastResult} question={currentQuestion} isLastQuestion={isLastQuestion} />
  }
  if (quizEvent.status === 'finished') {
    return <QuizFinalRanking player={player} quizEvent={quizEvent} />
  }

  return null
}
