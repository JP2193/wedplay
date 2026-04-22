import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName } from '../lib/rooms'
import GameScreen from '../components/guest/GameScreen'
import ThankYouScreen from '../components/guest/ThankYouScreen'

const TOKEN_KEY = (eventId, fullName) => `bingo-token-${eventId}-${fullName}`
const RULES_SEEN_KEY = (code) => `bingo-rules-seen-${code}`

function getOrCreateToken(eventId, fullName) {
  const key = TOKEN_KEY(eventId, fullName)
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const token = crypto.randomUUID()
  localStorage.setItem(key, token)
  return token
}

function hasSeenRules(code) {
  return !!localStorage.getItem(RULES_SEEN_KEY(code))
}

function markRulesSeen(code) {
  localStorage.setItem(RULES_SEEN_KEY(code), '1')
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Modal de reglas ─────────────────────────────────── */
function RulesModal({ onStart, onBack }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-amber-400 px-6 pt-6 pb-5 text-center">
          <img src="/img/bingoh.png" alt="Bingo" className="w-14 h-14 object-contain mx-auto mb-3" />
          <h2 className="text-xl font-black text-white">Bingo Humano</h2>
          <p className="text-white/80 text-sm mt-1">¿Cómo se juega?</p>
        </div>

        {/* Reglas */}
        <div className="px-6 py-5 space-y-3">
          {[
            { icon: '🔍', text: 'Encontrá al invitado que cumple con cada consigna y completá su nombre.' },
            { icon: '↔️', text: 'Podés navegar entre las preguntas libremente.' },
            { icon: '🏁', text: 'Al terminar, hacé click en "Cantar Bingo" para enviar tu cartón.' },
            { icon: '🏆', text: '¡El primero en encontrar a todos los invitados gana!' },
            { icon: '⚠️', text: 'Si volvés al lobby antes de enviar, tus respuestas no serán guardadas.' },
          ].map(({ icon, text }, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-lg shrink-0 mt-0.5">{icon}</span>
              <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={onStart}
            className="btn-primary w-full"
          >
            ¡Comenzar juego!
          </button>
          <button
            onClick={onBack}
            className="btn-ghost w-full text-sm"
          >
            Volver al lobby
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Pantalla de re-entrada (ya cantó bingo) ─────────── */
function AlreadyFinishedScreen({ onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="text-center space-y-5 max-w-xs">
        <img src="/img/bingoh.png" alt="Bingo" className="w-16 h-16 object-contain mx-auto opacity-80" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-800">¡Ya cantaste Bingo!</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            El anfitrión ya fue notificado. Esperá a que se anuncie al ganador.
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary text-sm px-6">
          ← Volver al lobby
        </button>
      </div>
    </div>
  )
}

/* ─── BingoRoomGuestPage ──────────────────────────────── */
export default function BingoRoomGuestPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [questions, setQuestions] = useState([])
  const [finished, setFinished] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [ready, setReady] = useState(false)   // true = pasó las reglas, mostrar juego
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

    const room = await getRoomByCode(code)
    if (!room) { navigate('/', { replace: true }); return }

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

      // Ya jugó antes (tiene cartón en curso): saltar reglas
      setReady(true)
      return
    }

    // Jugador nuevo: cargar preguntas pero mostrar reglas primero
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

    // Primera vez: mostrar modal de reglas
    if (!hasSeenRules(code)) {
      setShowRules(true)
    } else {
      setReady(true)
    }
  }

  function handleStartGame() {
    markRulesSeen(code)
    setShowRules(false)
    setReady(true)
  }

  // ── Renders ──

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

  // Ya cantó bingo en una sesión anterior → pantalla simple
  if (finished) {
    return <AlreadyFinishedScreen onBack={() => navigate(`/${code}`)} />
  }

  // Modal de reglas (primera vez, antes de empezar)
  if (showRules) {
    return (
      <>
        {/* Fondo semitransparente debajo del modal */}
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50" />
        <RulesModal
          onStart={handleStartGame}
          onBack={() => navigate(`/${code}`)}
        />
      </>
    )
  }

  if (!ready || !player) return null

  return (
    <GameScreen
      player={player}
      questions={questions}
      onFinished={() => setFinished(true)}
    />
  )
}
