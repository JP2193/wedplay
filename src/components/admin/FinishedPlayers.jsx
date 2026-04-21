import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function FinishedPlayers({ eventId }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()

    // Suscripción en tiempo real
    const channel = supabase
      .channel(`finished-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `event_id=eq.${eventId}` },
        () => fetchPlayers()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [eventId])

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('id, full_name, finished_at, bingo_called')
      .eq('event_id', eventId)
      .eq('finished', true)
      .order('finished_at', { ascending: true })

    if (!error) setPlayers(data)
    setLoading(false)
  }

  function formatTime(iso) {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-3">
      {loading && (
        <div className="text-center text-gray-400 py-6 text-sm">Cargando...</div>
      )}

      {!loading && players.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-gray-400 text-sm">Nadie terminó el juego todavía.</p>
          <p className="text-gray-400 text-xs mt-1">Cuando un jugador termine, aparecerá aquí en tiempo real.</p>
        </div>
      )}

      {players.map((p, idx) => (
        <div key={p.id} className={`card py-3 px-4 flex items-center gap-3 ${p.bingo_called ? 'border-rose-200 bg-rose-50' : ''}`}>
          <span className="text-sm font-semibold text-rose-300 w-6 shrink-0">#{idx + 1}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-gray-800 font-medium text-sm">{p.full_name}</p>
              {p.bingo_called && (
                <span className="text-xs font-bold bg-rose-400 text-white px-2 py-0.5 rounded-full">
                  🎊 BINGO
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs">{formatTime(p.finished_at)}</p>
          </div>
          <span className="text-green-400 text-sm">✓</span>
        </div>
      ))}

      {players.length > 0 && (
        <p className="text-xs text-gray-400 text-right">{players.length} jugadores terminaron</p>
      )}
    </div>
  )
}
