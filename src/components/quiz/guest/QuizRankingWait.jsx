export default function QuizRankingWait({ player }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="text-5xl animate-float">⏳</div>
        <p className="text-white text-xl font-semibold">Pregunta terminada</p>
        <p className="text-gray-400 text-sm">Esperá la siguiente pregunta...</p>
        <p className="text-gray-500 text-xs mt-4">Puntaje actual: <span className="text-white font-bold">{player.total_score?.toLocaleString() ?? 0} pts</span></p>
      </div>
    </div>
  )
}
