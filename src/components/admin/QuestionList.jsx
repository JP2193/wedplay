import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function QuestionList({ eventId }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [eventId])

  async function fetchQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (!error) setQuestions(data)
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newText.trim()) return
    setAdding(true)

    const { data, error } = await supabase
      .from('questions')
      .insert({ event_id: eventId, text: newText.trim() })
      .select()
      .single()

    if (!error) {
      setQuestions(prev => [...prev, data])
      setNewText('')
    }
    setAdding(false)
  }

  async function handleEdit(id) {
    if (!editText.trim()) return
    setSaving(true)

    const { data, error } = await supabase
      .from('questions')
      .update({ text: editText.trim() })
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

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)

    if (!error) {
      setQuestions(prev => prev.filter(q => q.id !== id))
    }
  }

  function startEdit(q) {
    setEditingId(q.id)
    setEditText(q.text)
  }

  return (
    <div className="space-y-4">
      {/* Add question */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Nueva pregunta..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
        />
        <button
          type="submit"
          disabled={adding || !newText.trim()}
          className="btn-primary py-2 px-4 text-sm whitespace-nowrap"
        >
          {adding ? '...' : 'Agregar'}
        </button>
      </form>

      {loading && (
        <div className="text-center text-gray-400 py-6 text-sm">Cargando preguntas...</div>
      )}

      {!loading && questions.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-400 text-sm">No hay preguntas todavía.</p>
          <p className="text-gray-400 text-xs mt-1">Agregá la primera usando el campo de arriba.</p>
        </div>
      )}

      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={q.id} className="card py-3 px-4">
            {editingId === q.id ? (
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
                <button
                  onClick={() => handleEdit(q.id)}
                  disabled={saving}
                  className="btn-primary py-2 px-3 text-xs"
                >
                  {saving ? '...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="btn-secondary py-2 px-3 text-xs"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-300 font-mono mt-0.5 w-5 shrink-0">{idx + 1}</span>
                <p className="text-gray-700 text-sm flex-1 leading-snug">{q.text}</p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(q)}
                    className="text-gray-300 hover:text-blue-400 text-xs transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-gray-300 hover:text-red-400 text-xs transition-colors"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
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
