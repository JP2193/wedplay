import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode } from '../lib/rooms'

const COLORS = [
  { bg: 'from-rose-900/60 to-pink-900/60', accent: '#fda4af' },
  { bg: 'from-amber-900/60 to-orange-900/60', accent: '#fcd34d' },
  { bg: 'from-violet-900/60 to-purple-900/60', accent: '#c4b5fd' },
  { bg: 'from-emerald-900/60 to-teal-900/60', accent: '#6ee7b7' },
  { bg: 'from-sky-900/60 to-blue-900/60', accent: '#93c5fd' },
]

/* ─── DeseosDisplayPage ─────────────────────────────────── */
export default function DeseosDisplayPage() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)
  const [wishes, setWishes] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [visible, setVisible] = useState(true)
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

  // Realtime — new approved wishes or updates
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

  // Auto-advance carousel
  useEffect(() => {
    if (wishes.length <= 1) return
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActiveIdx(i => (i + 1) % wishes.length)
        setVisible(true)
      }, 600)
    }, 7000)
    return () => clearInterval(intervalRef.current)
  }, [wishes.length])

  // If activeIdx goes out of range after a wish is deleted
  useEffect(() => {
    if (wishes.length > 0 && activeIdx >= wishes.length) setActiveIdx(0)
  }, [wishes.length])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white/30 text-sm">Cargando...</div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <p className="text-white/40 text-center">{error}</p>
    </div>
  )

  if (wishes.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-rose-950 to-gray-950 flex flex-col items-center justify-center gap-6 p-8">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative text-center">
        <div className="text-8xl mb-6">✨</div>
        <p className="text-white/30 text-2xl font-light">Los deseos aparecerán acá</p>
        {room && (
          <p className="text-white/15 text-lg mt-3 font-mono tracking-widest">{room.code}</p>
        )}
      </div>
    </div>
  )

  const wish = wishes[activeIdx] ?? wishes[0]
  const colorTheme = COLORS[activeIdx % COLORS.length]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-rose-950/20 to-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-0 left-0 w-[700px] h-[700px] bg-gradient-to-br ${colorTheme.bg} rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl transition-all duration-1000`} />
        <div className={`absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-br ${colorTheme.bg} rounded-full translate-x-1/3 translate-y-1/3 blur-3xl transition-all duration-1000`} />
      </div>

      {/* Floating decorative quotes */}
      <div className="absolute top-16 left-16 text-white/5 select-none pointer-events-none"
        style={{ fontSize: '18rem', lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</div>
      <div className="absolute bottom-16 right-16 text-white/5 select-none pointer-events-none"
        style={{ fontSize: '18rem', lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</div>

      {/* Main card */}
      <div
        className="relative z-10 flex flex-col items-center text-center max-w-3xl px-12"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
      >
        <div
          className="text-8xl leading-none mb-8 select-none"
          style={{ color: colorTheme.accent, opacity: 0.5, fontFamily: 'Georgia, serif' }}
        >"</div>

        <p className="text-white font-light leading-relaxed"
          style={{ fontSize: wish.message.length > 120 ? '2.2rem' : wish.message.length > 60 ? '2.8rem' : '3.5rem', lineHeight: 1.3 }}>
          {wish.message}
        </p>

        <div
          className="text-8xl leading-none mt-8 select-none self-end"
          style={{ color: colorTheme.accent, opacity: 0.5, fontFamily: 'Georgia, serif' }}
        >"</div>

        <p className="mt-8 text-lg font-semibold" style={{ color: colorTheme.accent }}>
          — {wish.guest_name}
        </p>
      </div>

      {/* Bottom: dots + counter */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4 z-10">
        {wishes.length > 1 && (
          <div className="flex gap-2.5">
            {wishes.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  clearInterval(intervalRef.current)
                  setVisible(false)
                  setTimeout(() => { setActiveIdx(i); setVisible(true) }, 300)
                }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activeIdx ? '2rem' : '0.5rem',
                  height: '0.5rem',
                  background: i === activeIdx ? colorTheme.accent : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        )}
        <p className="text-white/20 text-sm font-medium tracking-widest uppercase">
          {activeIdx + 1} / {wishes.length} deseos
        </p>
      </div>
    </div>
  )
}
