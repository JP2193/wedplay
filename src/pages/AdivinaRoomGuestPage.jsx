import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName } from '../lib/rooms'
import AdivinaWaitingRoom from '../components/adivina/guest/AdivinaWaitingRoom'
import AdivinaQuestion from '../components/adivina/guest/AdivinaQuestion'
import AdivinaRankingWait from '../components/adivina/guest/AdivinaRankingWait'
import AdivinaFinalRanking from '../components/adivina/guest/AdivinaFinalRanking'

const TOKEN_KEY = (eventId, fullName) => `adivina-token-${eventId}-${fullName}`

function getOrCreateToken(eventId, fullName) {
  const key = TOKEN_KEY(eventId, fullName)
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const token = crypto.randomUUID()
  localStorage.setItem(key, token)
  return token
}

export default function AdivinaRoomGuestPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [adivinaEvent, setAdivinaEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initGame()
  }, [code])

  async function initGame() {
    const guestName = getGuestName(code)
    if (!guestName) { navigate(`/${code}`, { replace: true }); return }

    const room = await getRoomByCode(code)
    if (!room) { navigate('/', { replace: true }); return }

    const { data: event } = await supabase
      .from('adivina_events')
      .select('*')
      .eq('room_id', room.id)
      .maybeSingle()

    if (!event) {
      setError('Adivina Quién todavía no está configurado. Volvé más tarde.')
      setLoading(false)
      return
    }

    if (event.status === 'finished') {
      setError('El juego ya finalizó.')
      setLoading(false)
      return
    }

    const sessionToken = getOrCreateToken(event.id, guestName)

    const { data: existing } = await supabase
      .from('adivina_players')
      .select('*')
      .eq('adivina_event_id', event.id)
      .eq('full_name', guestName)
      .maybeSingle()

    if (existing) {
      setPlayer({ ...existing, _sessionToken: sessionToken })
      setAdivinaEvent(event)
      setLoading(false)
      return
    }

    const { data: newPlayer, error: insertError } = await supabase
      .from('adivina_players')
      .insert({ adivina_event_id: event.id, full_name: guestName, session_token: sessionToken })
      .select()
      .single()

    if (insertError) {
      setError('Error al unirte al juego. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setPlayer({ ...newPlayer, _sessionToken: sessionToken })
    setAdivinaEvent(event)
    setLoading(false)
  }

  // Real-time event updates
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

  // Load questions when game starts
  useEffect(() => {
    if (!adivinaEvent || adivinaEvent.status === 'lobby' || questions.length > 0) return
    supabase.from('adivina_questions').select('*')
      .eq('adivina_event_id', adivinaEvent.id).order('position')
      .then(({ data }) => { if (data) setQuestions(data) })
  }, [adivinaEvent?.status])

  useEffect(() => { setLastResult(null) }, [adivinaEvent?.current_question_index])

  // If reset, re-init
  useEffect(() => {
    if (!player || !adivinaEvent || adivinaEvent.status !== 'lobby') return
    supabase.from('adivina_players').select('id').eq('id', player.id).maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setPlayer(null)
          setQuestions([])
          initGame()
        }
      })
  }, [adivinaEvent?.status])

  // Sync score during ranking
  useEffect(() => {
    if (!player || !adivinaEvent || adivinaEvent.status !== 'ranking') return
    supabase.from('adivina_players').select('total_score').eq('id', player.id).single()
      .then(({ data }) => { if (data) setPlayer(p => ({ ...p, total_score: data.total_score })) })
  }, [adivinaEvent?.status, adivinaEvent?.current_question_index])

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

  if (!player || !adivinaEvent) return null

  const currentQuestion = questions[adivinaEvent.current_question_index]

  if (adivinaEvent.status === 'lobby') {
    return <AdivinaWaitingRoom player={player} adivinaEvent={adivinaEvent} />
  }
  if (adivinaEvent.status === 'question') {
    if (!currentQuestion) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400 text-sm">Cargando pregunta...</div>
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
