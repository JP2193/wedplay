import { useNavigate } from 'react-router-dom'

const GAMES = [
  {
    icon: '/img/bingoh.png',
    name: 'Bingo Humano',
    description: 'Conocé a los demás respondiendo preguntas y encontrando coincidencias en el salón.',
    guestPath: '/bingo',
    adminPath: '/bingo/admin',
    from: 'from-rose-400',
    to: 'to-pink-500',
    btn: 'bg-rose-500 hover:bg-rose-600',
    badge: 'bg-rose-100 text-rose-600',
  },
  {
    icon: '/img/quiz.png',
    name: 'Quiz',
    description: 'Trivia en tiempo real con puntaje por velocidad. ¿Quién sabe más del grupo?',
    guestPath: '/quiz',
    adminPath: '/quiz/admin',
    from: 'from-emerald-400',
    to: 'to-teal-500',
    btn: 'bg-emerald-500 hover:bg-emerald-600',
    badge: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: '/img/adivina.png',
    name: 'Adivina Quién',
    description: '¿Quién maneja mejor? ¿Quién cocina más? Elegí entre los dos y sumate al ranking.',
    guestPath: '/adivina',
    adminPath: '/adivina/admin',
    from: 'from-violet-400',
    to: 'to-indigo-500',
    btn: 'bg-violet-500 hover:bg-violet-600',
    badge: 'bg-violet-100 text-violet-600',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-violet-100 flex flex-col items-center justify-center p-6 py-12">

      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-12">
        <img
          src="/img/wedplay.png"
          alt="WedPlay"
          className="w-52 sm:w-64 drop-shadow-md mb-6 select-none"
          draggable={false}
        />
        <h1 className="text-6xl sm:text-7xl font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 bg-clip-text text-transparent leading-none mb-3">
          WedPlay
        </h1>
        <p className="text-gray-500 text-base sm:text-lg font-medium">
          Juegos para tu boda 🎉
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-5">
        {GAMES.map(game => (
          <div
            key={game.name}
            className="bg-white rounded-3xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300"
          >
            {/* Card header coloreado */}
            <div className={`bg-gradient-to-br ${game.from} ${game.to} flex items-center justify-center py-7`}>
              <img
                src={game.icon}
                alt={game.name}
                className="w-20 h-20 object-contain drop-shadow-md"
              />
            </div>

            {/* Card body */}
            <div className="flex flex-col flex-1 p-5 gap-3">
              <h2 className="text-lg font-bold text-gray-800">{game.name}</h2>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">{game.description}</p>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => navigate(game.guestPath)}
                  className={`${game.btn} text-white font-semibold py-2.5 rounded-xl transition-colors text-sm w-full`}
                >
                  Jugar
                </button>
                <button
                  onClick={() => navigate(game.adminPath)}
                  className={`text-xs font-medium text-center py-1.5 rounded-lg ${game.badge} transition-colors w-full`}
                >
                  Admin →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
