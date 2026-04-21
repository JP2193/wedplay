import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

const TOKEN_KEY = (eventId, fullName) => `quiz-token-${eventId}-${fullName}`

function getOrCreateToken(eventId, fullName) {
  const key = TOKEN_KEY(eventId, fullName)
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const token = crypto.randomUUID()
  localStorage.setItem(key, token)
  return token
}

export default function QuizJoinScreen({ onJoined }) {
  const [step, setStep] = useState('code')
  const [code, setCode] = useState('')
  const [eventData, setEventData] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCodeSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('quiz_events')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (error || !data) {
      setError('Código inválido. Verificá que esté bien escrito.')
    } else if (data.status === 'finished') {
      setError('Este quiz ya finalizó.')
    } else {
      setEventData(data)
      setStep('name')
    }
    setLoading(false)
  }

  async function handleNameSubmit(e) {
    e.preventDefault()
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    if (!firstName.trim() || !lastName.trim()) return
    setLoading(true)
    setError(null)

    const sessionToken = getOrCreateToken(eventData.id, fullName)

    // Buscar jugador existente
    const { data: existing } = await supabase
      .from('quiz_players')
      .select('*')
      .eq('quiz_event_id', eventData.id)
      .eq('full_name', fullName)
      .maybeSingle()

    if (existing) {
      onJoined({ ...existing, _sessionToken: sessionToken }, eventData)
      setLoading(false)
      return
    }

    // Registrar nuevo jugador
    const { data: newPlayer, error: insertError } = await supabase
      .from('quiz_players')
      .insert({ quiz_event_id: eventData.id, full_name: fullName, session_token: sessionToken })
      .select().single()

    if (insertError) {
      setError('Error al registrarte. Intentá de nuevo.')
    } else {
      onJoined({ ...newPlayer, _sessionToken: sessionToken }, eventData)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <a href="/" className="inline-block text-gray-400 hover:text-gray-600 text-xs mb-1 transition-colors">← WedPlay</a>
          <div className="text-5xl">❓</div>
          <h1 className="text-3xl font-semibold text-gray-800">Quiz</h1>
        </div>

        <div className="card shadow-md">
          {step === 'code' ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Código del quiz</label>
                <input
                  type="text"
                  className="input-field text-center text-xl font-mono tracking-widest uppercase"
                  placeholder="XXXXXX"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={8} required autoFocus autoComplete="off"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-center">El anfitrión te compartirá el código</p>
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3 text-center">{error}</p>}
              <button type="submit" disabled={loading || !code.trim()} className="btn-primary w-full">
                {loading ? 'Verificando...' : 'Ingresar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="text-center">
                <span className="inline-block bg-rose-50 text-rose-500 text-xs font-medium px-3 py-1 rounded-full">
                  {eventData?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                  <input type="text" className="input-field" placeholder="María" value={firstName}
                    onChange={e => setFirstName(e.target.value)} required autoFocus autoComplete="given-name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
                  <input type="text" className="input-field" placeholder="García" value={lastName}
                    onChange={e => setLastName(e.target.value)} required autoComplete="family-name" />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3 text-center">{error}</p>}
              <button type="submit" disabled={loading || !firstName.trim() || !lastName.trim()} className="btn-primary w-full">
                {loading ? 'Un momento...' : 'Unirme al quiz'}
              </button>
              <button type="button" onClick={() => { setStep('code'); setError(null) }} className="btn-ghost w-full text-sm">
                ← Cambiar código
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
