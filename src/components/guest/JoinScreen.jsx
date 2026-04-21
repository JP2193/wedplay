import { useState } from 'react'
import { supabase } from '../../lib/supabase'

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

export default function JoinScreen({ onJoined }) {
  const [step, setStep] = useState('code') // 'code' | 'name'
  const [code, setCode] = useState('')
  const [eventData, setEventData] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCodeSubmit(e) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (eventError || !event) {
      setError('Código de evento inválido. Verificá que esté bien escrito.')
      setLoading(false)
      return
    }

    setEventData(event)
    setStep('name')
    setLoading(false)
  }

  async function handleNameSubmit(e) {
    e.preventDefault()
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    if (!firstName.trim() || !lastName.trim() || !eventData) return
    setLoading(true)
    setError(null)

    // Recuperar o crear token de sesión
    const sessionToken = getOrCreateToken(eventData.id, fullName)

    // Buscar jugador existente
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('event_id', eventData.id)
      .eq('full_name', fullName)
      .maybeSingle()

    if (existingPlayer) {
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .in('id', existingPlayer.assigned_questions || [])

      const ordered = (existingPlayer.assigned_questions || [])
        .map(id => questions.find(q => q.id === id))
        .filter(Boolean)

      // Pasar el token para que GameScreen pueda hacer updates
      onJoined({ ...existingPlayer, _sessionToken: sessionToken }, ordered)
      setLoading(false)
      return
    }

    // Nuevo jugador
    const { data: allQuestions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('event_id', eventData.id)

    if (qError || !allQuestions || allQuestions.length === 0) {
      setError('Este evento todavía no tiene preguntas cargadas.')
      setLoading(false)
      return
    }

    let selected = []

    if (eventData.dynamic_mode) {
      const easyPool = shuffle(allQuestions.filter(q => q.difficulty === 'easy'))
      const hardPool = shuffle(allQuestions.filter(q => q.difficulty === 'hard'))

      if (easyPool.length < eventData.easy_count || hardPool.length < eventData.hard_count) {
        setError('El banco de preguntas está incompleto. Avisale al organizador.')
        setLoading(false)
        return
      }

      selected = shuffle([
        ...easyPool.slice(0, eventData.easy_count),
        ...hardPool.slice(0, eventData.hard_count),
      ])
    } else {
      const count = Math.min(eventData.questions_per_player, allQuestions.length)
      selected = shuffle(allQuestions).slice(0, count)
    }

    const assignedIds = selected.map(q => q.id)

    const { data: newPlayer, error: insertError } = await supabase
      .from('players')
      .insert({
        event_id: eventData.id,
        full_name: fullName,
        assigned_questions: assignedIds,
        answers: {},
        finished: false,
        session_token: sessionToken,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message?.includes('Límite')
        ? 'Este evento alcanzó el límite de participantes.'
        : 'Error al registrarte. Intentá de nuevo.')
      setLoading(false)
      return
    }

    onJoined({ ...newPlayer, _sessionToken: sessionToken }, selected)
    setLoading(false)
  }

  const canSubmitName = firstName.trim() && lastName.trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <a href="/" className="inline-block text-gray-400 hover:text-gray-600 text-xs mb-1 transition-colors">← WedPlay</a>
          <div className="text-5xl">🎯</div>
          <h1 className="text-3xl font-semibold text-gray-800">Bingo Humano</h1>
        </div>

        <div className="card shadow-md">
          {step === 'code' ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Código del evento
                </label>
                <input
                  type="text"
                  className="input-field text-center text-xl font-mono tracking-widest uppercase"
                  placeholder="XXXXXX"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  required
                  autoFocus
                  autoComplete="off"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                  El anfitrión te compartirá el código
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3 text-center">{error}</p>
              )}

              <button type="submit" disabled={loading || !code.trim()} className="btn-primary w-full">
                {loading ? 'Verificando...' : 'Ingresar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="text-center mb-1">
                <span className="inline-block bg-rose-50 text-rose-500 text-xs font-medium px-3 py-1 rounded-full">
                  {eventData?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="María"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    autoFocus
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="García"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Si ya jugaste antes, usá el mismo nombre y apellido para retomar tu progreso.
              </p>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3 text-center">{error}</p>
              )}

              <button type="submit" disabled={loading || !canSubmitName} className="btn-primary w-full">
                {loading ? 'Un momento...' : 'Comenzar a jugar'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('code'); setError(null) }}
                className="btn-ghost w-full text-sm"
              >
                ← Cambiar código
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
