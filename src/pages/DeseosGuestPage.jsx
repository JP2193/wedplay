import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName } from '../lib/rooms'

const CARD_COLORS = ['bg-rose-100', 'bg-amber-100', 'bg-violet-100', 'bg-emerald-100', 'bg-sky-100']

// Persistencia del wish propio en localStorage (sobrevive recarga, no requiere auth)
function getMyWishId(code) { return localStorage.getItem(`wedplay-wish-${code}`) }
function setMyWishId(code, id) { localStorage.setItem(`wedplay-wish-${code}`, id) }
function clearMyWishId(code) { localStorage.removeItem(`wedplay-wish-${code}`) }

/* ─── WishCard (mosaico) ────────────────────────────────────── */
function WishCard({ wish, index, isOwn, onEdit, onDelete }) {
  const color = CARD_COLORS[index % CARD_COLORS.length]
  return (
    <div className={`${color} rounded-2xl p-4 break-inside-avoid mb-3 animate-wishIn relative`}>
      {isOwn && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={onEdit} className="text-[10px] font-bold text-gray-500 hover:text-gray-700 bg-white/70 hover:bg-white px-2 py-0.5 rounded-full transition-colors">Editar</button>
          <button onClick={onDelete} className="text-[10px] font-bold text-red-400 hover:text-red-600 bg-white/70 hover:bg-white px-2 py-0.5 rounded-full transition-colors">Borrar</button>
        </div>
      )}
      <p className="text-gray-800 text-sm leading-relaxed">
        <span className="opacity-20 mr-0.5 select-none align-middle"
          style={{ fontSize: '1.6rem', fontFamily: 'Georgia, serif', lineHeight: 1 }}>&ldquo;</span>
        {wish.message}
        <span className="opacity-20 ml-0.5 select-none align-middle"
          style={{ fontSize: '1.6rem', fontFamily: 'Georgia, serif', lineHeight: 1 }}>&rdquo;</span>
      </p>
      <p className="text-xs font-semibold mt-2.5 opacity-60">— {wish.guest_name}</p>
    </div>
  )
}

/* ─── CarouselView ──────────────────────────────────────────── */
function CarouselView({ wishes, guestName, onEdit, onDelete }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (wishes.length <= 1) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setActiveIdx(i => (i + 1) % wishes.length); setVisible(true) }, 350)
    }, 5000)
    return () => clearInterval(interval)
  }, [wishes.length])

  useEffect(() => { if (activeIdx >= wishes.length) setActiveIdx(0) }, [wishes.length])

  if (wishes.length === 0) return null

  const wish = wishes[activeIdx]
  const color = CARD_COLORS[activeIdx % CARD_COLORS.length]
  const isOwn = wish.guest_name === guestName

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div
        className={`${color} rounded-3xl shadow-lg p-8 w-full max-w-sm text-center transition-opacity duration-300 relative`}
        style={{ opacity: visible ? 1 : 0 }}
      >
        {isOwn && (
          <div className="absolute top-3 right-3 flex gap-1">
            <button onClick={onEdit} className="text-[10px] font-bold text-gray-500 hover:text-gray-700 bg-white/70 hover:bg-white px-2 py-0.5 rounded-full transition-colors">Editar</button>
            <button onClick={onDelete} className="text-[10px] font-bold text-red-400 hover:text-red-600 bg-white/70 hover:bg-white px-2 py-0.5 rounded-full transition-colors">Borrar</button>
          </div>
        )}
        <p className="leading-none opacity-15 mb-2 text-left select-none"
          style={{ fontSize: '5rem', fontFamily: 'Georgia, serif', lineHeight: 1 }}>&ldquo;</p>
        <p className="text-gray-800 text-xl font-medium leading-relaxed">{wish.message}</p>
        <p className="leading-none opacity-15 mt-2 text-right select-none"
          style={{ fontSize: '5rem', fontFamily: 'Georgia, serif', lineHeight: 1 }}>&rdquo;</p>
        <p className="text-sm font-semibold mt-5 opacity-60">— {wish.guest_name}</p>
      </div>
      {wishes.length > 1 && (
        <div className="flex gap-2">
          {wishes.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setActiveIdx(i); setVisible(true) }, 350) }}
              className={`h-2 rounded-full transition-all ${i === activeIdx ? 'bg-rose-400 w-4' : 'bg-gray-300 w-2'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── BottomSheet ───────────────────────────────────────────── */
function WishSheet({ room, guestName, existingWish, onClose, onSent }) {
  const isEditing = !!existingWish
  const [message, setMessage] = useState(existingWish?.message ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 100) }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)

    if (isEditing) {
      const { data, error: err } = await supabase.rpc('edit_wish', {
        p_wish_id: existingWish.id,
        p_guest_name: guestName,
        p_message: message.trim(),
      })
      if (err) { setError('No se pudo guardar. Intentá de nuevo.'); setSubmitting(false); return }
      onSent({ id: existingWish.id, wasEditing: true })
    } else {
      const { data, error: err } = await supabase.rpc('submit_wish', {
        p_room_id: room.id,
        p_guest_name: guestName,
        p_message: message.trim(),
      })
      if (err) { setError('No se pudo enviar. Intentá de nuevo.'); setSubmitting(false); return }
      onSent({ id: data?.id, wasEditing: false })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">{isEditing ? 'Editar tu deseo ✏️' : 'Dejá tu deseo ✨'}</h2>
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
            {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Enviar deseo ✉'}
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
  const [wishes, setWishes] = useState([])        // solo approved (lo que ve el tablero)
  const [myWishId, setMyWishIdState] = useState(null) // ID del wish propio (localStorage)
  const [loading, setLoading] = useState(true)
  const [showSheet, setShowSheet] = useState(false)
  const [editingWish, setEditingWish] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const name = getGuestName(code)
    if (!name) { navigate(`/${code}`, { replace: true }); return }
    setGuestNameState(name)

    // Recuperar wish ID guardado
    const savedId = getMyWishId(code)
    if (savedId) setMyWishIdState(savedId)

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
      .from('wishes').select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
    if (data) setWishes(data)
    setLoading(false)
  }

  function handleSent({ id, wasEditing }) {
    if (id) {
      setMyWishId(code, id)
      setMyWishIdState(id)
    }
    setShowSheet(false)
    setEditingWish(null)
    const deseosModule = room?.room_modules?.find(m => m.module_key === 'deseos')
    const mode = deseosModule?.settings?.moderation_mode
    if (!wasEditing) {
      setToast(mode === 'manual' ? 'pending' : 'sent')
      setTimeout(() => setToast(null), 4000)
    }
    fetchWishes(room.id)
  }

  async function handleDeleteOwn() {
    const wishId = myWishId || myApprovedWish?.id
    if (!wishId) return
    if (!window.confirm('¿Eliminar tu deseo?')) return
    await supabase.rpc('delete_own_wish', { p_wish_id: wishId, p_guest_name: guestName })
    clearMyWishId(code)
    setMyWishIdState(null)
    fetchWishes(room.id)
  }

  // El wish propio aprobado (visible en el tablero)
  const myApprovedWish = wishes.find(w => w.guest_name === guestName)
  // Tiene deseo si está aprobado en el tablero O si tiene ID guardado en localStorage
  const hasSubmitted = !!myApprovedWish || !!myWishId
  // Para editar: usamos el wish aprobado si está, o construimos uno mínimo con el ID guardado
  const wishToEdit = myApprovedWish ?? (myWishId ? { id: myWishId, message: '' } : null)

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

            {/* Sin deseo propio: botón de enviar */}
            {!hasSubmitted && (
              <button
                onClick={() => setShowSheet(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                Sumá el tuyo →
              </button>
            )}

            {/* Deseo aprobado y visible: botones editar/borrar */}
            {hasSubmitted && myApprovedWish && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setEditingWish(myApprovedWish); setShowSheet(true) }}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={handleDeleteOwn}
                  className="text-xs font-semibold text-red-400 hover:text-red-600 bg-white border border-red-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  Borrar
                </button>
              </div>
            )}

            {/* Deseo pendiente de aprobación */}
            {hasSubmitted && !myApprovedWish && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  ⏳ Esperando aprobación
                </span>
                <button
                  onClick={handleDeleteOwn}
                  className="text-xs font-semibold text-red-400 hover:text-red-600 bg-white border border-red-100 px-2.5 py-1.5 rounded-xl transition-colors"
                  title="Retirar deseo"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 pb-12">
        {wishes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-gray-400 text-sm">Sé el primero en dejar un deseo</p>
            {!hasSubmitted && (
              <button
                onClick={() => setShowSheet(true)}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Escribir deseo
              </button>
            )}
          </div>
        ) : displayMode === 'carousel' ? (
          <CarouselView
            wishes={wishes}
            guestName={guestName}
            onEdit={() => { setEditingWish(myApprovedWish); setShowSheet(true) }}
            onDelete={handleDeleteOwn}
          />
        ) : (
          <div className="columns-2 gap-3">
            {wishes.map((wish, i) => (
              <WishCard
                key={wish.id}
                wish={wish}
                index={i}
                isOwn={wish.guest_name === guestName}
                onEdit={() => { setEditingWish(wish); setShowSheet(true) }}
                onDelete={handleDeleteOwn}
              />
            ))}
          </div>
        )}
      </div>

      {showSheet && room && guestName && (
        <WishSheet
          room={room}
          guestName={guestName}
          existingWish={editingWish}
          onClose={() => { setShowSheet(false); setEditingWish(null) }}
          onSent={handleSent}
        />
      )}
    </div>
  )
}
