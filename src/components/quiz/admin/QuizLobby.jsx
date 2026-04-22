import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function QuizLobby({ quizEvent, room, onStart }) {
  const [players, setPlayers] = useState([])
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchPlayers()
    const channel = supabase
      .channel(`quiz-lobby-${quizEvent.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_players', filter: `quiz_event_id=eq.${quizEvent.id}` },
        () => fetchPlayers()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [quizEvent.id])

  async function fetchPlayers() {
    const { data } = await supabase
      .from('quiz_players')
      .select('id, full_name, created_at')
      .eq('quiz_event_id', quizEvent.id)
      .order('created_at', { ascending: true })
    if (data) setPlayers(data)
  }

  async function handleStart() {
    setStarting(true)
    await supabase.rpc('advance_quiz_state', {
      p_quiz_event_id: quizEvent.id,
      p_new_status: 'question',
      p_question_index: 0,
    })
    onStart()
  }

  return (
    <div className="space-y-6">
      <div className="card text-center space-y-3">
        <p className="text-gray-500 text-sm">Código del cuarto</p>
        <p className="text-4xl font-black font-mono text-rose-400 tracking-widest">{room?.code ?? quizEvent.code}</p>
        <p className="text-gray-400 text-xs">Los jugadores entran con este código desde el lobby</p>
        {room?.code && (
          <button
            type="button"
            onClick={() => window.open(`/${room.code}/quiz/display`, '_blank')}
            className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Abrir pantalla de proyección
          </button>
        )}
      </div>

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
