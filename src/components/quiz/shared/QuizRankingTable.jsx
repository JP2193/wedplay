export default function QuizRankingTable({ players, highlightId }) {
  const sorted = [...players].sort((a, b) => b.total_score - a.total_score)

  return (
    <div className="space-y-2">
      {sorted.map((p, idx) => {
        const isHighlight = p.id === highlightId
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null
        return (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
              isHighlight ? 'bg-rose-100 border-2 border-rose-300' : 'bg-white border border-gray-100'
            }`}
          >
            <span className="w-8 text-center">
              {medal ?? <span className="text-sm font-semibold text-gray-400">#{idx + 1}</span>}
            </span>
            <span className={`flex-1 font-medium text-sm ${isHighlight ? 'text-rose-700' : 'text-gray-800'}`}>
              {p.full_name}
            </span>
            <span className={`font-bold tabular-nums ${isHighlight ? 'text-rose-500' : 'text-gray-600'}`}>
              {p.total_score.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
