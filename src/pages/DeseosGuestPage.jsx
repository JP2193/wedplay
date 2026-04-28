import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName } from '../lib/rooms'

const CARD_COLORS = [
  'bg-rose-100',
  'bg-amber-100',
  'bg-violet-100',
  'bg-emerald-100',
  'bg-sky-100',
]

/* ─── WishCard ──────────────────────────────────────────────── */
function WishCard({ wish, index }) {
  const color = CARD_COLORS[index % CARD_COLORS.length]
  return (
    <div className={`${color} rounded-2xl p-4 break-inside-avoid mb-3 animate-wishIn`}>
      <p className="text-gray-800 text-sm leading-relaxed">
        <span className="text-2xl leading-none mr-1 opacity-30">"</span>
        {wish.message}
        <span className="text-2xl leading-none ml-1 opacity-30">"</span>
      </p>
      <p className="text-xs font-semibold mt-2.5 opacity-60">— {wish.guest_name}</p>
    </div>
  )
}

/* ─── BottomSheet (formulario) ──────────────────────────────── */
function WishSheet({ room, guestName, onClose, onSent }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.rpc('submit_wish', {
      p_room_id: room.id,
      p_guest_name: guestName,
      p_message: message.trim(),
    })
    if (err) {
      setError('No se pudo enviar. Intentá de nuevo.')
      setSubmitting(false)
    } else {
      onSent()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Dejá tu deseo ✨</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            ref={textareaRef}
            className="input-field resize-none"
            rows={4}
            placeholder="¡Que sean muy felices y...!"
            value={message}
            onChange={e => { setMessage(e.target.value); setError(null) }}
            maxLength={500}
            required
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
      </div>
    </div>
  )
}

/* ─── DeseosGuestPage ────────────────────────────────────────── */
export default function DeseosGuestPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [guestName, setGuestNameState] = useState(null)
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSheet, setShowSheet] = useState(false)
  const [toast, setToast] = useState(null) // 'sent' | 'pending'

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

  // Realtime: re-fetch on any approved wish change
  useEffect(() => {
    if (!room) return
    const channel = supabase
      .channel(`wishes-guest-${room.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'wishes', filter: `room_id=eq.${room.id}` },
        () => fetchWishes(room.id)
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

  function handleSent() {
    setShowSheet(false)
    // Check if moderation mode is manual (wish won't appear immediately)
    const deseosModule = room?.room_modules?.find(m => m.module_key === 'deseos')
    const mode = deseosModule?.settings?.moderation_mode
    setToast(mode === 'manual' ? 'pending' : 'sent')
    setTimeout(() => setToast(null), 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-amber-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-amber-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">✨</span>
            <h1 className="font-semibold text-gray-800 truncate">Deseos</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast && (
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                toast === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {toast === 'pending' ? '⏳ Pendiente de aprobación' : '✓ ¡Deseo enviado!'}
              </span>
            )}
            <button
              onClick={() => setShowSheet(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              Sumá el tuyo →
            </button>
          </div>
        </div>
      </header>

      {/* Mosaico */}
      <div className="max-w-lg mx-auto p-4 pb-12">
        {wishes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-gray-400 text-sm">Sé el primero en dejar un deseo</p>
            <button
              onClick={() => setShowSheet(true)}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Escribir deseo
            </button>
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {wishes.map((wish, i) => (
              <WishCard key={wish.id} wish={wish} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      {showSheet && room && guestName && (
        <WishSheet
          room={room}
          guestName={guestName}
          onClose={() => setShowSheet(false)}
          onSent={handleSent}
        />
      )}
    </div>
  )
}
