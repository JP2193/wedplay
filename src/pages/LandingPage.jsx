import { useNavigate } from 'react-router-dom'

const GAMES = [
  {
    emoji: '🎯',
    name: 'Bingo Humano',
    description: 'Conocé a los demás respondiendo preguntas y encontrando coincidencias en el salón.',
    guestPath: '/bingo',
    adminPath: '/bingo/admin',
    accent: 'rose',
  },
  {
    emoji: '❓',
    name: 'Quiz',
    description: 'Trivia en tiempo real con puntaje por velocidad. ¿Quién sabe más del grupo?',
    guestPath: '/quiz',
    adminPath: '/quiz/admin',
    accent: 'amber',
  },
  {
    emoji: '💍',
    name: 'Adivina Quién',
    description: '¿Quién maneja mejor? ¿Quién cocina más? Elegí entre los dos y sumate al ranking.',
    guestPath: '/adivina',
    adminPath: '/adivina/admin',
    accent: 'blue',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800">WedPlay</h1>
          <p className="text-gray-500 text-sm">Elegí el juego para tu evento</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map(game => (
            <div key={game.name} className="card flex flex-col gap-4">
              <div className="space-y-2">
                <div className="text-4xl">{game.emoji}</div>
                <h2 className="text-lg font-semibold text-gray-800">{game.name}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{game.description}</p>
              </div>
              <div className="mt-auto pt-2 flex flex-col gap-2">
                <button
                  onClick={() => navigate(game.guestPath)}
                  className="btn-primary w-full text-sm py-2.5"
                >
                  Jugar
                </button>
                <button
                  onClick={() => navigate(game.adminPath)}
                  className="text-gray-400 hover:text-gray-600 text-xs text-center transition-colors py-1"
                >
                  Admin →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
