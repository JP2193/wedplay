import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName } from '../lib/rooms'

const PALETTE = {
  bgGrad:    'linear-gradient(135deg, #f6f0e3 0%, #f9f3e6 50%, #efe4cc 100%)',
  cardBg:    '#f1e4c4',
  cardBgAlt: '#f6ecd2',
  ink:       '#2a2114',
  inkSoft:   '#6b5a3a',
  accent:    '#a8843a',
  quote:     '#c9a876',
}

// Persistencia del wish propio en localStorage (sobrevive recarga, no requiere auth)
function getMyWishId(code) { return localStorage.getItem(`wedplay-wish-${code}`) }
function setMyWishId(code, id) { localStorage.setItem(`wedplay-wish-${code}`, id) }
function clearMyWishId(code) { localStorage.removeItem(`wedplay-wish-${code}`) }

/* ─── WishCard (mosaico) ────────────────────────────────────── */
function WishCard({ wish, isOwn, onEdit, onDelete }) {
  const p = PALETTE
  return (
    <div
      className="break-inside-avoid mb-3 rounded-2xl relative overflow-hidden"
      style={{ background: p.cardBgAlt, padding: '28px 22px 20px' }}
    >
      {/* Comilla apertura — decorativa absoluta */}
      <span
        className="absolute top-1 left-3 font-serif select-none pointer-events-none leading-none"
        style={{ fontSize: '3.5rem', color: p.quote, opacity: 0.4, lineHeight: 1 }}
      >
        &ldquo;
      </span>
      {/* Comilla cierre — decorativa absoluta */}
      <span
        className="absolute bottom-8 right-3 font-serif select-none pointer-events-none leading-none"
        style={{ fontSize: '3.5rem', color: p.quote, opacity: 0.4, lineHeight: 1 }}
      >
        &rdquo;
      </span>

      {isOwn && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <button
            onClick={onEdit}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.7)', color: p.inkSoft }}
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.5)', color: p.accent }}
          >
            Borrar
          </button>
        </div>
      )}

      <p className="font-serif text-sm leading-relaxed relative z-1" style={{ color: p.ink, fontWeight: 400 }}>
        {wish.message}
      </p>
      <p className="text-xs mt-2.5" style={{ color: p.inkSoft, fontWeight: 500 }}>
        — {wish.display_name || wish.guest_name}
      </p>
    </div>
  )
}

/* ─── CarouselView ──────────────────────────────────────────── */
function CarouselView({ wishes, guestName, onEdit, onDelete }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const p = PALETTE

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
  const isOwn = wish.guest_name === guestName

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div
        className="rounded-3xl shadow-sm px-7 py-9 w-full max-w-sm text-center transition-opacity duration-300 relative overflow-hidden"
        style={{ opacity: visible ? 1 : 0, background: p.cardBgAlt }}
      >
        {/* Comillas decorativas absolutas */}
        <span
          className="absolute top-2 left-3 font-serif select-none pointer-events-none leading-none"
          style={{ fontSize: '4rem', color: p.quote, opacity: 0.35, lineHeight: 1 }}
        >
          &ldquo;
        </span>
        <span
          className="absolute bottom-10 right-3 font-serif select-none pointer-events-none leading-none"
          style={{ fontSize: '4rem', color: p.quote, opacity: 0.35, lineHeight: 1 }}
        >
          &rdquo;
        </span>

        {isOwn && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button
              onClick={onEdit}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.7)', color: p.inkSoft }}
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.5)', color: p.accent }}
            >
              Borrar
            </button>
          </div>
        )}

        <p className="font-serif text-lg leading-relaxed" style={{ color: p.ink, fontWeight: 400 }}>
          {wish.message}
        </p>
        <p className="text-sm mt-5" style={{ color: p.inkSoft, fontWeight: 500 }}>
          — {wish.display_name || wish.guest_name}
        </p>
      </div>

      {wishes.length > 1 && (
        <div className="flex gap-2">
          {wishes.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setActiveIdx(i); setVisible(true) }, 350) }}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === activeIdx ? '1.5rem' : '6px',
                background: i === activeIdx ? p.accent : 'rgba(0,0,0,0.15)',
              }}
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
  const [displayName, setDisplayName] = useState(existingWish?.display_name ?? guestName)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)
  const p = PALETTE

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
        p_display_name: displayName.trim() || guestName,
      })
      if (err) { setError('No se pudo guardar. Intentá de nuevo.'); setSubmitting(false); return }
      onSent({ id: existingWish.id, wasEditing: true })
    } else {
      const { data, error: err } = await supabase.rpc('submit_wish', {
        p_room_id: room.id,
        p_guest_name: guestName,
        p_message: message.trim(),
        p_display_name: displayName.trim() || guestName,
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
          <h2 className="font-semibold" style={{ color: p.ink }}>
            {isEditing ? 'Editar tu deseo' : 'Dejá tu deseo'}
          </h2>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: p.inkSoft }}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: p.inkSoft }}>
              De parte de
            </label>
            <input
              className="input-field"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={guestName}
              maxLength={80}
            />
          </div>
          <textarea
            ref={textareaRef}
            className="input-field resize-none font-serif"
            rows={4}
            placeholder="¡Que sean muy felices y...!"
            value={message}
            onChange={e => { setMessage(e.target.value); setError(null) }}
            maxLength={500}
            required
            style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1rem', color: p.ink }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: p.inkSoft }}>{message.length}/500</span>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-40"
            style={{ background: p.accent }}
          >
            {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Enviar deseo'}
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
  const [myWishId, setMyWishIdState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSheet, setShowSheet] = useState(false)
  const [editingWish, setEditingWish] = useState(null)
  const [toast, setToast] = useState(null)
  const p = PALETTE

  useEffect(() => {
    const name = getGuestName(code)
    if (!name) { navigate(`/${code}`, { replace: true }); return }
    setGuestNameState(name)

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

  const myApprovedWish = wishes.find(w => w.guest_name === guestName)
  const hasSubmitted = !!myApprovedWish || !!myWishId
  const wishToEdit = myApprovedWish ?? (myWishId ? { id: myWishId, message: '' } : null)

  const deseosModule = room?.room_modules?.find(m => m.module_key === 'deseos')
  const displayMode = deseosModule?.settings?.display_mode ?? 'masonry'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: p.bgGrad }}>
        <div className="text-sm" style={{ color: p.inkSoft }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: p.bgGrad }}>
      <header className="bg-white/80 backdrop-blur border-b px-4 py-3 sticky top-0 z-10" style={{ borderColor: `${p.quote}44` }}>
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/${code}`)}
              className="text-sm hover:opacity-70 flex items-center gap-1 shrink-0 transition-opacity"
              style={{ color: p.accent }}
            >
              ← Lobby
            </button>
            <span style={{ color: p.quote, opacity: 0.5 }}>|</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <h1
                className="font-serif italic truncate"
                style={{ color: p.ink, fontSize: '1.1rem', fontWeight: 400 }}
              >
                Deseos
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast && (
              <span
                className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={toast === 'pending'
                  ? { background: '#fef9c3', color: '#92400e' }
                  : { background: '#d1fae5', color: '#065f46' }
                }
              >
                {toast === 'pending' ? 'Pendiente de aprobación' : '✓ ¡Enviado!'}
              </span>
            )}

            {!hasSubmitted && (
              <button
                onClick={() => setShowSheet(true)}
                className="text-white text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80 whitespace-nowrap"
                style={{ background: p.accent }}
              >
                Sumá el tuyo →
              </button>
            )}

            {hasSubmitted && myApprovedWish && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setEditingWish(myApprovedWish); setShowSheet(true) }}
                  className="text-xs font-semibold bg-white border px-3 py-1.5 rounded-xl transition-colors hover:bg-gray-50"
                  style={{ color: p.inkSoft, borderColor: `${p.quote}66` }}
                >
                  Editar
                </button>
                <button
                  onClick={handleDeleteOwn}
                  className="text-xs font-semibold bg-white border px-3 py-1.5 rounded-xl transition-colors hover:bg-red-50"
                  style={{ color: '#ef4444', borderColor: '#fecaca' }}
                >
                  Borrar
                </button>
              </div>
            )}

            {hasSubmitted && !myApprovedWish && (
              <div className="flex items-center gap-1.5">
                <span
                  className="text-xs font-medium border px-3 py-1.5 rounded-xl"
                  style={{ color: p.inkSoft, borderColor: `${p.quote}66`, background: 'rgba(255,255,255,0.6)' }}
                >
                  Esperando aprobación
                </span>
                <button
                  onClick={handleDeleteOwn}
                  className="text-xs font-semibold bg-white border px-2.5 py-1.5 rounded-xl transition-colors hover:bg-red-50"
                  style={{ color: '#ef4444', borderColor: '#fecaca' }}
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
            <div
              className="font-serif italic text-5xl mb-4"
              style={{ color: p.quote, opacity: 0.5 }}
            >
              ❝
            </div>
            <p className="text-sm" style={{ color: p.inkSoft }}>Sé el primero en dejar un deseo</p>
            {!hasSubmitted && (
              <button
                onClick={() => setShowSheet(true)}
                className="mt-4 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: p.accent }}
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
            {wishes.map((wish) => (
              <WishCard
                key={wish.id}
                wish={wish}
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
