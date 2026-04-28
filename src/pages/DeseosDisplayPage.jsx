import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { getRoomByCode } from '../lib/rooms'

const THEMES = [
  { from: '#4c0519', to: '#1c1917', accent: '#fda4af', glow: 'rgba(253,164,175,0.15)' },
  { from: '#431407', to: '#1c1917', accent: '#fdba74', glow: 'rgba(253,186,116,0.15)' },
  { from: '#2e1065', to: '#0f172a', accent: '#c4b5fd', glow: 'rgba(196,181,253,0.15)' },
  { from: '#052e16', to: '#0f172a', accent: '#6ee7b7', glow: 'rgba(110,231,183,0.15)' },
  { from: '#0c1445', to: '#0f172a', accent: '#93c5fd', glow: 'rgba(147,197,253,0.15)' },
]

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

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white/20 text-sm tracking-widest uppercase">Cargando...</div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <p className="text-white/30 text-center">{error}</p>
    </div>
  )

  if (wishes.length === 0) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(253,164,175,0.06) 0%, transparent 70%)' }} />
      </div>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, ease: 'easeOut' }}
        className="text-7xl">✨</motion.div>
      <p className="text-white/25 text-xl font-light tracking-wide">Los deseos aparecerán acá</p>
      {room && <p className="text-white/10 font-mono tracking-[0.3em] text-sm mt-2">{room.code}</p>}
    </div>
  )

  const wish = wishes[activeIdx] ?? wishes[0]
  const theme = THEMES[activeIdx % THEMES.length]
  const fontSize = wish.message.length > 150 ? '2.4rem' : wish.message.length > 80 ? '3.2rem' : '4rem'

  return (
    <div className="h-screen overflow-hidden relative flex flex-col items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` }}>

      {/* Fondo animado */}
      <motion.div key={`bg-${activeIdx}`} className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
        <div className="absolute top-0 left-0 w-[80vw] h-[80vh] rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3"
          style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }} />
        <div className="absolute bottom-0 right-0 w-[60vw] h-[60vh] rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"
          style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }} />
      </motion.div>

      {/* Comillas decorativas de fondo */}
      <div className="absolute top-6 left-8 select-none pointer-events-none leading-none"
        style={{ fontSize: '22rem', fontFamily: 'Georgia, serif', color: theme.accent, opacity: 0.07, lineHeight: 1 }}>
        &ldquo;
      </div>
      <div className="absolute bottom-6 right-8 select-none pointer-events-none leading-none"
        style={{ fontSize: '22rem', fontFamily: 'Georgia, serif', color: theme.accent, opacity: 0.07, lineHeight: 1 }}>
        &rdquo;
      </div>

      {/* Contenido central */}
      <div className="relative z-10 flex flex-col items-center text-center px-16 max-w-5xl w-full">
        <AnimatePresence mode="wait">
          <motion.div key={wish.id} className="flex flex-col items-center gap-8 w-full">
            <motion.p
              variants={messageVariants}
              initial="initial" animate="animate" exit="exit"
              className="font-light leading-snug"
              style={{
                fontSize,
                color: 'white',
                textShadow: `0 0 60px ${theme.glow}, 0 4px 24px rgba(0,0,0,0.7)`,
                letterSpacing: '-0.01em',
              }}
            >
              {wish.message}
            </motion.p>

            <motion.div variants={authorVariants} initial="initial" animate="animate" exit="exit"
              className="flex items-center gap-3">
              <div className="h-px w-8" style={{ background: theme.accent, opacity: 0.5 }} />
              <p className="text-lg font-medium tracking-wide" style={{ color: theme.accent }}>
                {wish.display_name || wish.guest_name}
              </p>
              <div className="h-px w-8" style={{ background: theme.accent, opacity: 0.5 }} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots + contador */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4 z-10">
        {wishes.length > 1 && (
          <div className="flex gap-3 items-center">
            {wishes.map((_, i) => (
              <button key={i}
                onClick={() => { clearInterval(intervalRef.current); setActiveIdx(i) }}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === activeIdx ? '2rem' : '6px',
                  height: '6px',
                  background: i === activeIdx ? theme.accent : 'rgba(255,255,255,0.2)',
                  boxShadow: i === activeIdx ? `0 0 12px ${theme.accent}` : 'none',
                }}
              />
            ))}
          </div>
        )}
        <p className="text-xs tracking-[0.2em] uppercase" style={{ color: theme.accent, opacity: 0.4 }}>
          {activeIdx + 1} / {wishes.length} deseos
        </p>
      </div>
    </div>
  )
}
