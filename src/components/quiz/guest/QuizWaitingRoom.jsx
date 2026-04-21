export default function QuizWaitingRoom({ player, quizEvent }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-xs">
        <div className="text-6xl animate-float">🎯</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-800">{quizEvent.name}</h1>
          <p className="text-gray-500 text-sm">Hola, <span className="font-medium">{player.full_name}</span></p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            <p className="text-gray-600 font-medium text-sm">Esperando que el anfitrión inicie el juego</p>
          </div>
          <p className="text-gray-400 text-xs">Ya estás registrado. No cierres esta pantalla.</p>
        </div>
      </div>
    </div>
  )
}
