import { useState } from 'react'
import { supabase } from '../../lib/supabase'

function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function CreateEventModal({ adminId, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [questionsPerPlayer, setQuestionsPerPlayer] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    // Intentar generar código único (reintenta si hay colisión)
    let code = generateCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('code', code)
        .maybeSingle()

      if (!existing) break
      code = generateCode()
      attempts++
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        admin_id: adminId,
        name: name.trim(),
        code,
        questions_per_player: questionsPerPlayer,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      onCreated(data)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Nuevo evento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del evento</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: Boda de María y Juan"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preguntas por jugador</label>
            <input
              type="number"
              className="input-field"
              min={1}
              max={100}
              value={questionsPerPlayer}
              onChange={e => setQuestionsPerPlayer(Number(e.target.value))}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Cantidad de preguntas que recibirá cada invitado</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="btn-primary flex-1">
              {loading ? 'Creando...' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
