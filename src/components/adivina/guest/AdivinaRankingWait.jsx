export default function AdivinaRankingWait({ player, lastResult, adivinaEvent, question, isLastQuestion }) {
  const didAnswer = lastResult !== null
  const isCorrect = lastResult?.is_correct

  const correctPerson = lastResult?.correct_person
  const correctName = correctPerson === 1 ? adivinaEvent.person1_name : adivinaEvent.person2_name
  const correctPhoto = correctPerson === 1 ? adivinaEvent.person1_photo_url : adivinaEvent.person2_photo_url

  const icon = !didAnswer ? '⏰' : isCorrect ? '✅' : '❌'
  const verdict = !didAnswer
    ? 'No respondiste a tiempo'
    : isCorrect
      ? '¡Acertaste!'
      : 'Incorrecto'
  const verdictColor = !didAnswer ? 'text-gray-300' : isCorrect ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="text-center space-y-5 max-w-sm w-full">
        <div className="text-6xl">{icon}</div>

        <p className={`text-2xl font-bold ${verdictColor}`}>{verdict}</p>

        {correctName && (
          <div className="bg-white/10 rounded-2xl px-5 py-4 flex flex-col items-center gap-3">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Respuesta correcta</p>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 bg-white/10 flex items-center justify-center">
              {correctPhoto ? (
                <img src={correctPhoto} alt={correctName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{correctName[0]?.toUpperCase()}</span>
              )}
            </div>
            <p className="text-white font-semibold text-lg">{correctName}</p>
          </div>
        )}

        <div className="border-t border-white/10 pt-4 space-y-1">
          <p className="text-gray-400 text-sm">
            {isLastQuestion ? 'Esperando resultados...' : 'Esperá la siguiente pregunta...'}
          </p>
          <p className="text-gray-500 text-xs">
            Puntaje actual:{' '}
            <span className="text-white font-bold">{player.total_score?.toLocaleString() ?? 0} pts</span>
          </p>
        </div>
      </div>
    </div>
  )
}
