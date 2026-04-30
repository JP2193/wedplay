import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { getRoomByCode } from '../lib/rooms'

const PALETTE = {
  bg:       '#f6f0e3',
  bgGrad:   'linear-gradient(135deg, #f6f0e3 0%, #f9f3e6 50%, #efe4cc 100%)',
  ink:      '#2a2114',
  inkSoft:  '#6b5a3a',
  accent:   '#a8843a',
  quote:    '#c9a876',
}

const messageVariants = {
  initial: { opacity: 0, y: 60, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -40, filter: 'blur(6px)', transition: { duration: 0.5, ease: 'easeIn' } },
}

const authorVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.3 } },
}

export default function DeseosDisplayPage() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)
  const [wishes, setWishes] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => { init() }, [code])

  async function init() {
    const roomData = await getRoomByCode(code)
    if (!roomData) { setError('Cuarto no encontrado.'); setLoading(false); return }
    setRoom(roomData)
    await fetchWishes(roomData.id)
    setLoading(false)
  }

  async function fetchWishes(roomId) {
    const { data } = await supabase
      .from('wishes').select('*')
      .eq('room_id', roomId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
    if (data) setWishes(data)
  }

  useEffect(() => {
    if (!room) return
    const channel = supabase
      .channel(`wishes-display-${room.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'wishes', filter: `room_id=eq.${room.id}` },
        () => fetchWishes(room.id)
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [room?.id])

  useEffect(() => {
    if (wishes.length <= 1) return
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % wishes.length)
    }, 7000)
    return () => clearInterval(intervalRef.current)
  }, [wishes.length])

  useEffect(() => {
    if (wishes.length > 0 && activeIdx >= wishes.length) setActiveIdx(0)
  }, [wishes.length])

  const p = PALETTE

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: p.bgGrad }}>
      <div className="text-sm tracking-widest uppercase" style={{ color: p.inkSoft }}>Cargando...</div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: p.bgGrad }}>
      <p className="text-center" style={{ color: p.inkSoft }}>{error}</p>
    </div>
  )

  if (wishes.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative overflow-hidden" style={{ background: p.bgGrad }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="font-serif italic text-5xl"
        style={{ color: p.quote }}
      >
        ❝
      </motion.div>
      <p className="text-xl font-light tracking-wide" style={{ color: p.inkSoft }}>
        Los deseos aparecerán acá
      </p>
      {room?.code && (
        <p className="font-mono tracking-[0.3em] text-sm mt-2" style={{ color: p.quote }}>
          {room.code}
        </p>
      )}
    </div>
  )

  const wish = wishes[activeIdx] ?? wishes[0]
  const fontSize = wish.message.length > 200 ? '1.75rem' : wish.message.length > 100 ? '2.25rem' : '2.75rem'
  const isShort = wish.message.length < 80

  return (
    <div
      className="h-screen overflow-hidden relative flex flex-col items-center justify-center"
      style={{ background: p.bgGrad }}
    >
      {/* Comillas decorativas de fondo */}
      <div
        className="absolute top-4 left-6 select-none pointer-events-none leading-none font-serif"
        style={{ fontSize: '20rem', color: p.quote, opacity: 0.08, lineHeight: 1 }}
      >
        &ldquo;
      </div>
      <div
        className="absolute bottom-4 right-6 select-none pointer-events-none leading-none font-serif"
        style={{ fontSize: '20rem', color: p.quote, opacity: 0.08, lineHeight: 1 }}
      >
        &rdquo;
      </div>

      {/* Líneas laterales ornamentales */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 w-px h-20" style={{ background: p.inkSoft, opacity: 0.2 }} />
      <div className="absolute right-5 top-1/2 -translate-y-1/2 w-px h-20" style={{ background: p.inkSoft, opacity: 0.2 }} />

      {/* Top-left: nombre del evento */}
      {room?.event_name && (
        <div
          className="absolute top-8 left-10 font-serif italic"
          style={{ fontSize: '1.05rem', color: p.accent, letterSpacing: '0.01em' }}
        >
          {room.event_name}
        </div>
      )}

      {/* Top-right: fecha */}
      {room?.event_date && (
        <div
          className="absolute top-9 right-10"
          style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: p.inkSoft }}
        >
          {new Date(room.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}

      {/* Contenido central */}
      <div className="relative z-10 flex flex-col items-center text-center px-20 max-w-5xl w-full">
        {/* Label */}
        <div
          className="mb-8"
          style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: p.inkSoft }}
        >
          Deseos para los novios
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={wish.id} className="flex flex-col items-center gap-6 w-full">
            {/* Texto del deseo */}
            <motion.p
              variants={messageVariants}
              initial="initial" animate="animate" exit="exit"
              className="font-serif leading-snug"
              style={{
                fontSize,
                color: p.ink,
                fontStyle: isShort ? 'italic' : 'normal',
                letterSpacing: '-0.01em',
                maxWidth: '760px',
                textWrap: 'balance',
                fontWeight: 400,
              }}
            >
              {wish.message}
            </motion.p>

            {/* Autor */}
            <motion.div
              variants={authorVariants}
              initial="initial" animate="animate" exit="exit"
              className="flex items-center gap-3"
            >
              <div className="h-px w-8" style={{ background: p.accent, opacity: 0.5 }} />
              <p
                className="font-serif italic"
                style={{ fontSize: '1.2rem', color: p.accent, fontWeight: 400 }}
              >
                {wish.display_name || wish.guest_name}
              </p>
              <div className="h-px w-8" style={{ background: p.accent, opacity: 0.5 }} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom-left: hint QR */}
      <div
        className="absolute bottom-8 left-10"
        style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: p.inkSoft, opacity: 0.6 }}
      >
        Sumá tu deseo · QR en cada mesa
      </div>

      {/* Bottom-right: dots + contador */}
      <div className="absolute bottom-7 right-10 flex flex-col items-end gap-3 z-10">
        {wishes.length > 1 && (
          <div className="flex gap-2 items-center">
            {wishes.map((_, i) => (
              <button
                key={i}
                onClick={() => { clearInterval(intervalRef.current); setActiveIdx(i) }}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === activeIdx ? '1.5rem' : '5px',
                  height: '5px',
                  background: i === activeIdx ? p.accent : `${p.inkSoft}44`,
                }}
              />
            ))}
          </div>
        )}
        <p
          className="font-serif italic"
          style={{ fontSize: '0.8rem', color: p.inkSoft, fontVariantNumeric: 'tabular-nums' }}
        >
          {String(activeIdx + 1).padStart(2, '0')} / {String(wishes.length).padStart(2, '0')}
        </p>
      </div>
    </div>
  )
}
