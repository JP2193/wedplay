import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import QuizRankingTable from '../../quiz/shared/QuizRankingTable'

export default function AdivinaFinalRanking({ player, adivinaEvent }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('adivina_players')
      .select('id, full_name, total_score')
      .eq('adivina_event_id', adivinaEvent.id)
      .order('total_score', { ascending: false })
      .then(({ data }) => {
        if (data) setPlayers(data)
        setLoading(false)
      })
  }, [])

  const myPosition = players.findIndex(p => p.id === player.id) + 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col p-5">
      <div className="text-center space-y-2 py-6">
        <div className="text-4xl">🏁</div>
        <h1 className="text-2xl font-bold text-white">Ranking final</h1>
        {myPosition > 0 && (
          <p className="text-gray-400 text-sm">
            Quedaste en el puesto <span className="text-white font-bold">#{myPosition}</span> con{' '}
            <span className="text-rose-400 font-bold">{player.total_score?.toLocaleString() ?? 0} pts</span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 text-sm">Cargando...</div>
      ) : (
        <QuizRankingTable players={players} highlightId={player.id} />
      )}

      <button
        onClick={() => window.location.href = '/adivina'}
        className="btn-secondary mt-6 w-full text-sm"
      >
        Salir
      </button>
    </div>
  )
}
