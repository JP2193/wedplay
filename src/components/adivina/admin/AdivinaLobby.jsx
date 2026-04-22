import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AdivinaLobby({ adivinaEvent, room, onStart }) {
  const [players, setPlayers] = useState([])
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchPlayers()
    const channel = supabase
      .channel(`adivina-lobby-${adivinaEvent.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'adivina_players', filter: `adivina_event_id=eq.${adivinaEvent.id}` },
        () => fetchPlayers()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [adivinaEvent.id])

  async function fetchPlayers() {
    const { data } = await supabase
      .from('adivina_players')
      .select('id, full_name, joined_at')
      .eq('adivina_event_id', adivinaEvent.id)
      .order('joined_at', { ascending: true })
    if (data) setPlayers(data)
  }

  async function handleStart() {
    setStarting(true)
    await supabase.rpc('advance_adivina_state', {
      p_adivina_event_id: adivinaEvent.id,
      p_new_status: 'question',
      p_question_index: 0,
    })
    onStart()
  }

  return (
    <div className="space-y-6">
      {room && (
        <button
          onClick={() => window.open(`/${room.code}/adivina/display`, '_blank')}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-violet-50 border border-violet-200 text-violet-600 font-medium text-sm rounded-xl hover:bg-violet-100 transition-colors"
        >
          📺 Abrir pantalla de proyección
        </button>
      )}

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Jugadores conectados</h3>
          <span className="text-sm font-bold text-rose-400">{players.length}</span>
        </div>

        {players.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Esperando jugadores...</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {players.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50">
                <span className="text-xs text-gray-300 w-5">#{idx + 1}</span>
                <span className="text-sm text-gray-700">{p.full_name}</span>
                <span className="ml-auto text-green-400 text-xs">●</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={starting || players.length === 0}
        className="btn-primary w-full py-4 text-lg"
      >
        {starting ? 'Iniciando...' : '▶ Iniciar juego'}
      </button>
      {players.length === 0 && (
        <p className="text-xs text-gray-400 text-center">Necesitás al menos un jugador para iniciar</p>
      )}
    </div>
  )
}
