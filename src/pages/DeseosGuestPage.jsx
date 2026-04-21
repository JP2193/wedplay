import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName } from '../lib/rooms'

export default function DeseosGuestPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [guestName, setGuestNameState] = useState(null)
  const [wishes, setWishes] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const name = getGuestName(code)
    if (!name) { navigate(`/${code}`, { replace: true }); return }
    setGuestNameState(name)

    getRoomByCode(code).then(r => {
      if (!r) { navigate('/', { replace: true }); return }
      setRoom(r)
      fetchWishes(r.id)
    })
  }, [code])

  // Real-time wishes
  useEffect(() => {
    if (!room) return
    const channel = supabase
      .channel(`wishes-guest-${room.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wishes', filter: `room_id=eq.${room.id}` },
        payload => setWishes(prev => [payload.new, ...prev])
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [room?.id])

  async function fetchWishes(roomId) {
    const { data } = await supabase
      .from('wishes')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
    if (data) setWishes(data)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim() || !room) return
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('wishes')
      .insert({ room_id: room.id, guest_name: guestName, message: message.trim() })

    if (insertError) {
      setError('No se pudo enviar el deseo. Intentá de nuevo.')
    } else {
      setMessage('')
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-amber-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h1 className="font-semibold text-gray-800">Deseos</h1>
          </div>
          <button onClick={() => navigate(`/${code}`)} className="btn-ghost text-sm">← Lobby</button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 pb-12 space-y-4">
        {/* Send wish form */}
        <div className="card border border-amber-100">
          <h2 className="font-semibold text-gray-800 mb-1 text-sm">
            {submitted ? '¡Gracias por tu deseo! ✨' : 'Dejá un deseo para los novios'}
          </h2>
          {!submitted && (
            <form onSubmit={handleSubmit} className="space-y-3 mt-3">
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="¡Que sean muy felices y...!"
                value={message}
                onChange={e => { setMessage(e.target.value); if (error) setError(null) }}
                required
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{message.length}/500</span>
                {error && <p className="text-red-500 text-xs">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {submitting ? 'Enviando...' : 'Enviar deseo ✉'}
              </button>
            </form>
          )}
          {submitted && (
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm text-amber-600 hover:text-amber-700 mt-2 font-medium"
            >
              Enviar otro deseo →
            </button>
          )}
        </div>

        {/* Wishes feed */}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
            {wishes.length === 0 ? 'Todavía no hay deseos' : `${wishes.length} deseo${wishes.length === 1 ? '' : 's'}`}
          </p>
          <div className="space-y-3">
            {wishes.map(wish => (
              <div key={wish.id} className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                <p className="text-xs font-semibold text-amber-600 mb-1.5">{wish.guest_name}</p>
                <p className="text-gray-700 text-sm leading-relaxed">{wish.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
