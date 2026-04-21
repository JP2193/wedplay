import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function PlayerAnswersModal({ player, onClose }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!player.assigned_questions?.length) {
        setLoading(false)
        return
      }
      const { data: questions } = await supabase
        .from('questions')
        .select('id, text')
        .in('id', player.assigned_questions)

      if (questions) {
        const ordered = player.assigned_questions
          .map(id => questions.find(q => q.id === id))
          .filter(Boolean)
          .map(q => ({
            text: q.text,
            answer: player.answers?.[q.id] || '',
          }))
        setRows(ordered)
      }
      setLoading(false)
    }
    load()
  }, [player])

  const answered = rows.filter(r => r.answer.trim()).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800">{player.full_name}</h2>
              {player.bingo_called && (
                <span className="text-xs font-bold bg-rose-400 text-white px-2 py-0.5 rounded-full">🎊 BINGO</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {answered} de {rows.length} respuestas completadas
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">×</button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto p-4 space-y-2">
          {loading && <p className="text-center text-gray-400 text-sm py-6">Cargando...</p>}

          {!loading && rows.map((row, idx) => (
            <div key={idx} className={`rounded-xl p-3 ${row.answer.trim() ? 'bg-gray-50' : 'bg-amber-50'}`}>
              <p className="text-xs text-gray-400 mb-1">#{idx + 1}</p>
              <p className="text-sm text-gray-700 leading-snug">{row.text}</p>
              {row.answer.trim() ? (
                <p className="text-sm font-semibold text-rose-500 mt-1">→ {row.answer}</p>
              ) : (
                <p className="text-xs text-amber-400 mt-1 italic">Sin respuesta</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function FinishedPlayers({ eventId }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchPlayers()

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
      .select('id, full_name, finished_at, bingo_called, assigned_questions, answers')
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
    <>
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
          <div
            key={p.id}
            onClick={() => setSelected(p)}
            className={`card py-3 px-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all duration-200 ${p.bingo_called ? 'border-rose-200 bg-rose-50' : ''}`}
          >
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
            <span className="text-gray-300 text-sm">›</span>
          </div>
        ))}

        {players.length > 0 && (
          <p className="text-xs text-gray-400 text-right">{players.length} jugadores terminaron</p>
        )}
      </div>

      {selected && (
        <PlayerAnswersModal
          player={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
