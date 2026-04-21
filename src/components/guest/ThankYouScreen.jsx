import { useEffect, useState } from 'react'

const EMOJIS = ['🎊', '⭐', '🌸', '💫', '🎉', '✨', '🌟', '🎈']

function Confetti() {
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    emoji: EMOJIS[i % EMOJIS.length],
    left: `${5 + (i * 6) % 90}%`,
    delay: `${(i * 0.07).toFixed(2)}s`,
    size: i % 3 === 0 ? 'text-2xl' : 'text-lg',
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`absolute animate-confetti ${p.size}`}
          style={{ left: p.left, top: '-10px', animationDelay: p.delay }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

export default function ThankYouScreen() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 3200)
    return () => clearTimeout(t)
  }, [])

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-xs">
          <div className="text-6xl animate-float">🎯</div>
          <h1 className="text-2xl font-semibold text-gray-800">¡Que disfrutes la fiesta!</h1>
          <p className="text-gray-400 text-sm">El anfitrión ya sabe que cantaste Bingo.</p>
          <button
            onClick={() => window.location.href = '/guest'}
            className="btn-secondary text-sm px-6"
          >
            Salir
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #f97066 0%, #fb923c 50%, #fbbf24 100%)' }}
    >
      <Confetti />
      <div className="text-center space-y-4 relative z-10">
        <div className="animate-bingo-pop">
          <p className="text-8xl font-black text-white tracking-widest drop-shadow-lg select-none">
            BINGO
          </p>
        </div>
        <div className="animate-float text-6xl">🎊</div>
        <p className="text-white/80 text-lg font-medium">¡El anfitrión fue notificado!</p>
      </div>
    </div>
  )
}
