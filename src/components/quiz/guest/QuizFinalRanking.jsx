import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizRankingTable from '../shared/QuizRankingTable'

export default function QuizFinalRanking({ player, quizEvent }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('quiz_players')
      .select('id, full_name, total_score')
      .eq('quiz_event_id', quizEvent.id)
      .order('total_score', { ascending: false })
      .then(({ data }) => {
        if (data) setPlayers(data)
        setLoading(false)
      })
  }, [])

  const myPosition = players.findIndex(p => p.id === player.id) + 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex flex-col p-5">
      <div className="text-center space-y-2 py-6">
        <div className="text-4xl">🏁</div>
        <h1 className="text-2xl font-bold text-white">Ranking final</h1>
        {myPosition > 0 && (
          <p className="text-white/40 text-sm">
            Quedaste en el puesto <span className="text-white font-bold">#{myPosition}</span> con{' '}
            <span className="text-purple-300 font-bold">{player.total_score?.toLocaleString() ?? 0} pts</span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 text-sm">Cargando...</div>
      ) : (
        <QuizRankingTable players={players} highlightId={player.id} />
      )}

      <button
        onClick={() => window.location.href = '/quiz'}
        className="btn-secondary mt-6 w-full text-sm"
      >
        Salir
      </button>
    </div>
  )
}
