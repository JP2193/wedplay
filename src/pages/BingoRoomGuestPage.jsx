import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName } from '../lib/rooms'
import GameScreen from '../components/guest/GameScreen'
import ThankYouScreen from '../components/guest/ThankYouScreen'

const TOKEN_KEY = (eventId, fullName) => `bingo-token-${eventId}-${fullName}`

function getOrCreateToken(eventId, fullName) {
  const key = TOKEN_KEY(eventId, fullName)
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const token = crypto.randomUUID()
  localStorage.setItem(key, token)
  return token
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function BingoRoomGuestPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [questions, setQuestions] = useState([])
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initGame()
  }, [code])

  async function initGame() {
    setLoading(true)
    const guestName = getGuestName(code)
    if (!guestName) {
      navigate(`/${code}`, { replace: true })
      return
    }

    // Get room
    const room = await getRoomByCode(code)
    if (!room) { navigate('/', { replace: true }); return }

    // Get bingo event for this room
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('room_id', room.id)
      .maybeSingle()

    if (!event) {
      setError('El Bingo Humano todavía no está configurado. Volvé más tarde.')
      setLoading(false)
      return
    }

    const sessionToken = getOrCreateToken(event.id, guestName)

    // Look up existing player
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('event_id', event.id)
      .eq('full_name', guestName)
      .maybeSingle()

    if (existingPlayer) {
      if (existingPlayer.finished) {
        setPlayer(existingPlayer)
        setFinished(true)
        setLoading(false)
        return
      }
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .in('id', existingPlayer.assigned_questions || [])

      const ordered = (existingPlayer.assigned_questions || [])
        .map(id => qs?.find(q => q.id === id))
        .filter(Boolean)

      setPlayer({ ...existingPlayer, _sessionToken: sessionToken })
      setQuestions(ordered)
      setLoading(false)
      return
    }

    // Create new player
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('event_id', event.id)

    if (!allQuestions || allQuestions.length === 0) {
      setError('El Bingo no tiene preguntas configuradas todavía.')
      setLoading(false)
      return
    }

    let selectedQuestions
    if (event.dynamic_mode) {
      const easy = shuffle(allQuestions.filter(q => q.difficulty === 'easy')).slice(0, event.easy_count || 7)
      const hard = shuffle(allQuestions.filter(q => q.difficulty === 'hard')).slice(0, event.hard_count || 3)
      selectedQuestions = shuffle([...easy, ...hard])
    } else {
      selectedQuestions = shuffle(allQuestions).slice(0, event.questions_per_player || 10)
    }

    const assignedIds = selectedQuestions.map(q => q.id)

    const { data: newPlayer, error: insertError } = await supabase
      .from('players')
      .insert({
        event_id: event.id,
        full_name: guestName,
        session_token: sessionToken,
        assigned_questions: assignedIds,
        answers: {},
      })
      .select()
      .single()

    if (insertError) {
      setError('Error al unirte al juego. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setPlayer({ ...newPlayer, _sessionToken: sessionToken })
    setQuestions(selectedQuestions)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="text-rose-400 text-sm">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 p-6 text-center gap-4">
        <div className="text-5xl">😕</div>
        <p className="text-gray-600 text-sm">{error}</p>
        <button onClick={() => navigate(`/${code}`)} className="btn-ghost text-sm">
          ← Volver al lobby
        </button>
      </div>
    )
  }

  if (finished) return <ThankYouScreen onBack={() => navigate(`/${code}`)} />

  return (
    <GameScreen
      player={player}
      questions={questions}
      onFinished={() => setFinished(true)}
    />
  )
}
