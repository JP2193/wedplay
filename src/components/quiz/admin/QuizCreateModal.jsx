import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function QuizCreateModal({ adminId, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [timer, setTimer] = useState(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    let code = generateCode()
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from('quiz_events').select('id').eq('code', code).maybeSingle()
      if (!data) break
      code = generateCode()
    }

    const { data, error } = await supabase
      .from('quiz_events')
      .insert({ admin_id: adminId, name: name.trim(), code, timer_seconds: timer })
      .select()
      .single()

    if (error) {
      setError('Error al crear el evento.')
    } else {
      onCreated(data)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Nuevo Quiz</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del quiz</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: ¿Quién conoce más a los novios?"
              value={name}
              onChange={e => setName(e.target.value)}
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segundos por pregunta</label>
            <input
              type="number"
              className="input-field"
              min={5} max={60}
              value={timer}
              onChange={e => setTimer(Number(e.target.value))}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading || !name.trim()} className="btn-primary flex-1">
              {loading ? 'Creando...' : 'Crear quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
