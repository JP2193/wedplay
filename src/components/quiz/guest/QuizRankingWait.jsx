export default function QuizRankingWait({ player, lastResult, question }) {
  const didAnswer = lastResult !== null
  const isCorrect = lastResult?.is_correct

  const correctOptionKey = lastResult?.correct_option
    ? `option_${lastResult.correct_option.toLowerCase()}`
    : null
  const correctText = correctOptionKey && question ? question[correctOptionKey] : null

  const icon = !didAnswer ? '⏰' : isCorrect ? '✅' : '❌'
  const verdict = !didAnswer
    ? 'No respondiste a tiempo'
    : isCorrect
      ? '¡Acertaste!'
      : 'Incorrecto'
  const verdictColor = isCorrect ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="text-center space-y-5 max-w-sm w-full">
        <div className="text-6xl">{icon}</div>

        <p className={`text-2xl font-bold ${didAnswer ? verdictColor : 'text-gray-300'}`}>
          {verdict}
        </p>

        {correctText && (
          <div className="bg-white/10 rounded-2xl px-5 py-4 space-y-1">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Respuesta correcta</p>
            <p className="text-white font-semibold text-lg">{correctText}</p>
          </div>
        )}

        <div className="border-t border-white/10 pt-4 space-y-1">
          <p className="text-gray-400 text-sm">Esperá la siguiente pregunta...</p>
          <p className="text-gray-500 text-xs">
            Puntaje actual:{' '}
            <span className="text-white font-bold">{player.total_score?.toLocaleString() ?? 0} pts</span>
          </p>
        </div>
      </div>
    </div>
  )
}
