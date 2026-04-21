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

function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-gray-300 hover:text-rose-400 transition-colors ml-1 align-middle"
        aria-label="Más información"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-10 left-6 top-0 w-64 bg-gray-800 text-white text-xs rounded-xl p-3 shadow-lg leading-relaxed">
          {text}
          <button onClick={() => setOpen(false)} className="block mt-2 text-gray-400 hover:text-white">Cerrar</button>
        </div>
      )}
    </span>
  )
}

export default function CreateEventModal({ adminId, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [questionsPerPlayer, setQuestionsPerPlayer] = useState(10)
  const [dynamicMode, setDynamicMode] = useState(false)
  const [easyCount, setEasyCount] = useState(7)
  const [hardCount, setHardCount] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const totalDynamic = easyCount + hardCount

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    if (dynamicMode && (easyCount < 1 || hardCount < 1)) {
      setError('En modo dinámico necesitás al menos 1 pregunta fácil y 1 difícil.')
      return
    }

    setLoading(true)
    setError(null)

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
        questions_per_player: dynamicMode ? totalDynamic : questionsPerPlayer,
        dynamic_mode: dynamicMode,
        easy_count: dynamicMode ? easyCount : null,
        hard_count: dynamicMode ? hardCount : null,
      })
      .select()
      .single()

    if (error) {
      setError(error.message?.includes('Límite') ? error.message : 'Error al crear el evento. Intentá de nuevo.')
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

          {/* Modo dinámico toggle */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">Modo dinámico</span>
                <InfoTooltip text="En modo dinámico podés asignar distintos niveles de dificultad a tus preguntas. Indicá cuántas fáciles y cuántas difíciles recibirá cada invitado, y el sistema las mezcla aleatoriamente. El invitado no ve la dificultad." />
              </div>
              <button
                type="button"
                onClick={() => setDynamicMode(d => !d)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dynamicMode ? 'bg-rose-400' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${dynamicMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {!dynamicMode && (
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
              </div>
            )}

            {dynamicMode && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-emerald-600 mb-1">Preguntas fáciles</label>
                    <input
                      type="number"
                      className="input-field border-emerald-200 focus:ring-emerald-300"
                      min={0}
                      max={100}
                      value={easyCount}
                      onChange={e => setEasyCount(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-orange-500 mb-1">Preguntas difíciles</label>
                    <input
                      type="number"
                      className="input-field border-orange-200 focus:ring-orange-300"
                      min={0}
                      max={100}
                      value={hardCount}
                      onChange={e => setHardCount(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Total por jugador: <span className="font-semibold text-gray-600">{totalDynamic}</span> preguntas
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading || !name.trim()} className="btn-primary flex-1">
              {loading ? 'Creando...' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
