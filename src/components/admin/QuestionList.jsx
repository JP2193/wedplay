import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

function DifficultyBadge({ difficulty }) {
  if (difficulty === 'easy') return (
    <span className="text-xs font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Fácil</span>
  )
  if (difficulty === 'hard') return (
    <span className="text-xs font-medium bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">Difícil</span>
  )
  return null
}

function DifficultySelect({ value, onChange, className = '' }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white ${className}`}
    >
      <option value="easy">Fácil</option>
      <option value="hard">Difícil</option>
    </select>
  )
}

function Warning({ message }) {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p className="text-amber-700 text-sm leading-snug">{message}</p>
    </div>
  )
}

export default function QuestionList({ event }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [newDifficulty, setNewDifficulty] = useState('easy')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('easy')
  const [saving, setSaving] = useState(false)
  const [csvError, setCsvError] = useState(null)
  const [csvSuccess, setCsvSuccess] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

  const dynamicMode = event.dynamic_mode

  useEffect(() => {
    fetchQuestions()
  }, [event.id])

  async function fetchQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })

    if (!error) setQuestions(data)
    setLoading(false)
  }

  // Warning de preguntas insuficientes
  function getWarning() {
    if (!dynamicMode) return null
    const easy = questions.filter(q => q.difficulty === 'easy').length
    const hard = questions.filter(q => q.difficulty === 'hard').length
    const warnings = []
    if (easy < event.easy_count) {
      warnings.push(`Faltan ${event.easy_count - easy} pregunta(s) fácil(es) (tenés ${easy}, necesitás ${event.easy_count}).`)
    }
    if (hard < event.hard_count) {
      warnings.push(`Faltan ${event.hard_count - hard} pregunta(s) difícil(es) (tenés ${hard}, necesitás ${event.hard_count}).`)
    }
    if (warnings.length === 0) return null
    return warnings.join(' ')
  }

  function getNormalWarning() {
    if (dynamicMode) return null
    if (questions.length < event.questions_per_player) {
      return `Faltan ${event.questions_per_player - questions.length} pregunta(s) para poder asignar ${event.questions_per_player} a cada jugador.`
    }
    return null
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newText.trim()) return
    setAdding(true)

    const payload = {
      event_id: event.id,
      text: newText.trim(),
      ...(dynamicMode ? { difficulty: newDifficulty } : {}),
    }

    const { data, error } = await supabase
      .from('questions')
      .insert(payload)
      .select()
      .single()

    if (error) {
      alert(error.message?.includes('Límite') ? error.message : 'Error al agregar la pregunta.')
    } else {
      setQuestions(prev => [...prev, data])
      setNewText('')
    }
    setAdding(false)
  }

  async function handleEdit(id) {
    if (!editText.trim()) return
    setSaving(true)

    const payload = {
      text: editText.trim(),
      ...(dynamicMode ? { difficulty: editDifficulty } : {}),
    }

    const { data, error } = await supabase
      .from('questions')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      setQuestions(prev => prev.map(q => q.id === id ? data : q))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta pregunta?')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) setQuestions(prev => prev.filter(q => q.id !== id))
  }

  function startEdit(q) {
    setEditingId(q.id)
    setEditText(q.text)
    setEditDifficulty(q.difficulty || 'easy')
  }

  // CSV Import
  async function handleCsvImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setCsvError(null)
    setCsvSuccess(null)
    setImporting(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

      // Detectar si tiene header (primera línea no es una pregunta de contenido)
      let dataLines = lines
      const firstLower = lines[0]?.toLowerCase() || ''
      if (firstLower.includes('pregunta') || firstLower.includes('frase') || firstLower.includes('dificultad') || firstLower.includes('difficulty')) {
        dataLines = lines.slice(1)
      }

      if (dataLines.length === 0) {
        setCsvError('El archivo CSV está vacío.')
        setImporting(false)
        fileRef.current.value = ''
        return
      }

      const rows = []
      const invalid = []

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i]
        // Parseo simple: dividir por coma o punto y coma
        const parts = line.split(/[,;]/).map(p => p.trim().replace(/^["']|["']$/g, ''))

        if (dynamicMode) {
          const questionText = parts[0]
          const diffRaw = (parts[1] || '').toLowerCase()
          const difficulty = diffRaw.includes('dif') || diffRaw === 'hard' ? 'hard' : diffRaw.includes('fac') || diffRaw === 'easy' ? 'easy' : null

          if (!questionText || !difficulty) {
            invalid.push(i + 1)
            continue
          }
          rows.push({ event_id: event.id, text: questionText, difficulty })
        } else {
          const questionText = parts[0]
          if (!questionText) {
            invalid.push(i + 1)
            continue
          }
          rows.push({ event_id: event.id, text: questionText })
        }
      }

      if (invalid.length > 0) {
        setCsvError(`Filas con errores (omitidas): ${invalid.join(', ')}. ${dynamicMode ? 'En modo dinámico cada fila debe tener: pregunta, dificultad (fácil/difícil o easy/hard).' : 'Verificá que cada fila tenga texto.'}`)
      }

      if (rows.length === 0) {
        setCsvError('No se encontraron filas válidas para importar.')
        setImporting(false)
        fileRef.current.value = ''
        return
      }

      const { data, error } = await supabase
        .from('questions')
        .insert(rows)
        .select()

      if (error) {
        setCsvError(error.message?.includes('Límite') ? error.message : `Error al importar: ${error.message}`)
      } else {
        setQuestions(prev => [...prev, ...data])
        setCsvSuccess(`${data.length} pregunta(s) importada(s) correctamente.`)
      }
    } catch (err) {
      setCsvError('No se pudo leer el archivo. Asegurate de que sea un CSV válido.')
    }

    setImporting(false)
    fileRef.current.value = ''
  }

  const warning = getWarning() || getNormalWarning()
  const easyCount = questions.filter(q => q.difficulty === 'easy').length
  const hardCount = questions.filter(q => q.difficulty === 'hard').length

  return (
    <div className="space-y-4">
      {/* Warning */}
      {warning && <Warning message={warning} />}

      {/* Stats en modo dinámico */}
      {dynamicMode && questions.length > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{easyCount}</p>
            <p className="text-xs text-emerald-500 mt-0.5">Fáciles <span className="text-emerald-300">/ {event.easy_count} requeridas</span></p>
          </div>
          <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{hardCount}</p>
            <p className="text-xs text-orange-400 mt-0.5">Difíciles <span className="text-orange-200">/ {event.hard_count} requeridas</span></p>
          </div>
        </div>
      )}

      {/* Agregar pregunta */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Nueva pregunta..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
        />
        {dynamicMode && (
          <DifficultySelect value={newDifficulty} onChange={setNewDifficulty} />
        )}
        <button
          type="submit"
          disabled={adding || !newText.trim()}
          className="btn-primary py-2 px-4 text-sm whitespace-nowrap"
        >
          {adding ? '...' : 'Agregar'}
        </button>
      </form>

      {/* Importar CSV */}
      <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Importar CSV</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {dynamicMode
                ? 'Formato: pregunta, dificultad (fácil/difícil)'
                : 'Formato: una pregunta por fila'}
            </p>
          </div>
          <label className="btn-secondary py-2 px-3 text-sm cursor-pointer">
            {importing ? 'Importando...' : '📎 Subir CSV'}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCsvImport}
              disabled={importing}
            />
          </label>
        </div>
        {csvError && <p className="text-red-500 text-xs bg-red-50 rounded-lg p-2">{csvError}</p>}
        {csvSuccess && <p className="text-emerald-600 text-xs bg-emerald-50 rounded-lg p-2">{csvSuccess}</p>}
      </div>

      {loading && (
        <div className="text-center text-gray-400 py-6 text-sm">Cargando preguntas...</div>
      )}

      {!loading && questions.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-400 text-sm">No hay preguntas todavía.</p>
          <p className="text-gray-400 text-xs mt-1">Agregá la primera usando el campo de arriba o importá un CSV.</p>
        </div>
      )}

      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={q.id} className="card py-3 px-4">
            {editingId === q.id ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field flex-1 py-2 text-sm"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEdit(q.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  {dynamicMode && (
                    <DifficultySelect value={editDifficulty} onChange={setEditDifficulty} />
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(q.id)} disabled={saving} className="btn-primary py-1.5 px-3 text-xs">
                    {saving ? '...' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary py-1.5 px-3 text-xs">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-300 font-mono mt-0.5 w-5 shrink-0">{idx + 1}</span>
                <p className="text-gray-700 text-sm flex-1 leading-snug">{q.text}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {dynamicMode && <DifficultyBadge difficulty={q.difficulty} />}
                  <button onClick={() => startEdit(q)} className="text-gray-300 hover:text-blue-400 text-xs transition-colors" title="Editar">✏️</button>
                  <button onClick={() => handleDelete(q.id)} className="text-gray-300 hover:text-red-400 text-xs transition-colors" title="Eliminar">🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <p className="text-xs text-gray-400 text-right">{questions.length} preguntas en total</p>
      )}
    </div>
  )
}
