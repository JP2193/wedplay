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

/* ─── WishCard (mosaico) ────────────────────────────────────── */
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

/* ─── CarouselView ──────────────────────────────────────────── */
function CarouselView({ wishes }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (wishes.length <= 1) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActiveIdx(i => (i + 1) % wishes.length)
        setVisible(true)
      }, 350)
    }, 5000)
    return () => clearInterval(interval)
  }, [wishes.length])

  // Reset index if wishes shrink
  useEffect(() => {
    if (activeIdx >= wishes.length) setActiveIdx(0)
  }, [wishes.length])

  if (wishes.length === 0) return null

  const wish = wishes[activeIdx]
  const color = CARD_COLORS[activeIdx % CARD_COLORS.length]

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Card central */}
      <div
        className={`${color} rounded-3xl shadow-lg p-8 w-full max-w-sm text-center transition-opacity duration-300`}
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="text-3xl leading-none opacity-20 mb-3">"</p>
        <p className="text-gray-800 text-xl font-medium leading-relaxed">{wish.message}</p>
        <p className="text-3xl leading-none opacity-20 mt-3 text-right">"</p>
        <p className="text-sm font-semibold mt-5 opacity-60">— {wish.guest_name}</p>
      </div>

      {/* Dots */}
      {wishes.length > 1 && (
        <div className="flex gap-2">
          {wishes.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setActiveIdx(i); setVisible(true) }, 350) }}
              className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? 'bg-rose-400 w-4' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
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
  const [toast, setToast] = useState(null)

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
    const deseosModule = room?.room_modules?.find(m => m.module_key === 'deseos')
    const mode = deseosModule?.settings?.moderation_mode
    setToast(mode === 'manual' ? 'pending' : 'sent')
    setTimeout(() => setToast(null), 4000)
  }

  const deseosModule = room?.room_modules?.find(m => m.module_key === 'deseos')
  const displayMode = deseosModule?.settings?.display_mode ?? 'masonry'

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
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/${code}`)}
              className="text-rose-400 text-sm hover:text-rose-500 flex items-center gap-1 shrink-0"
            >
              ← Lobby
            </button>
            <span className="text-amber-200">|</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-lg shrink-0">✨</span>
              <h1 className="font-semibold text-gray-800 truncate">Deseos</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast && (
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                toast === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {toast === 'pending' ? '⏳ Pendiente' : '✓ ¡Enviado!'}
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

      {/* Contenido */}
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
        ) : displayMode === 'carousel' ? (
          <CarouselView wishes={wishes} />
        ) : (
          <div className="columns-2 gap-3">
            {wishes.map((wish, i) => (
              <WishCard key={wish.id} wish={wish} index={i} />
            ))}
          </div>
        )}
      </div>

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
