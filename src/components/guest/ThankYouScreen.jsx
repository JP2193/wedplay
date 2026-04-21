import { useState } from 'react'
import { supabase } from '../../lib/supabase'

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

export default function ThankYouScreen({ playerId }) {
  const [phase, setPhase] = useState('ask') // 'ask' | 'bingo' | 'done'
  const [loading, setLoading] = useState(false)

  async function handleBingo() {
    setLoading(true)
    await supabase
      .from('players')
      .update({ bingo_called: true })
      .eq('id', playerId)
    setLoading(false)
    setPhase('bingo')

    setTimeout(() => setPhase('done'), 3000)
  }

  if (phase === 'bingo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-400 via-pink-400 to-amber-400 flex items-center justify-center p-6 relative overflow-hidden">
        <Confetti />
        <div className="text-center space-y-4 relative z-10">
          <div className="animate-bingo-pop">
            <p className="text-8xl font-black text-white tracking-widest drop-shadow-lg">
              BINGO
            </p>
          </div>
          <div className="animate-float text-6xl">🎊</div>
          <p className="text-white/80 text-lg font-medium">¡El anfitrión fue notificado!</p>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-xs">
          <div className="text-6xl animate-float">💍</div>
          <h1 className="text-2xl font-semibold text-gray-800">¡Que disfrutes la fiesta!</h1>
          <p className="text-gray-400 text-sm">El anfitrión ya sabe que cantaste Bingo.</p>
        </div>
      </div>
    )
  }

  // phase === 'ask'
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-xs w-full">
        <div className="space-y-3">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-semibold text-gray-800">¡Tus respuestas fueron guardadas!</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Ahora andá a buscar a esas personas en la fiesta.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 space-y-4">
          <p className="text-gray-700 font-medium text-lg">¿Encontraste a todos?</p>
          <p className="text-gray-400 text-sm">
            Si completaste tu cartón, ¡cantá Bingo y avisale al anfitrión!
          </p>
          <button
            onClick={handleBingo}
            disabled={loading}
            className="w-full py-4 text-xl font-black tracking-widest bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? '...' : '🎊 ¡BINGO!'}
          </button>
        </div>
      </div>
    </div>
  )
}
