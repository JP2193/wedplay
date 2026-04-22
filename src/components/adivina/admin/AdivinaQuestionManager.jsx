import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

function emptyForm() {
  return { text: '', correct_person: 1 }
}

function QuestionForm({ f, setF, onSubmit, onCancel, submitLabel, loading: isLoading, person1Name, person2Name }) {
  return (
    <div className="space-y-3 bg-gray-50 rounded-xl p-4">
      <input
        type="text"
        className="input-field"
        placeholder="Texto de la pregunta..."
        value={f.text}
        onChange={e => setF('text', e.target.value)}
      />
      <div>
        <span className="text-sm text-gray-600 font-medium block mb-2">¿Quién es la respuesta correcta?</span>
        <div className="flex gap-3">
          <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer border-2 rounded-xl p-3 transition-all ${f.correct_person === 1 ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <input
              type="radio"
              name="correct-person"
              value={1}
              checked={f.correct_person === 1}
              onChange={() => setF('correct_person', 1)}
              className="hidden"
            />
            <span className={`text-sm font-semibold ${f.correct_person === 1 ? 'text-blue-600' : 'text-gray-500'}`}>
              {person1Name}
            </span>
            {f.correct_person === 1 && <span className="text-blue-500 text-xs">✓</span>}
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer border-2 rounded-xl p-3 transition-all ${f.correct_person === 2 ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'}`}>
            <input
              type="radio"
              name="correct-person"
              value={2}
              checked={f.correct_person === 2}
              onChange={() => setF('correct_person', 2)}
              className="hidden"
            />
            <span className={`text-sm font-semibold ${f.correct_person === 2 ? 'text-rose-600' : 'text-gray-500'}`}>
              {person2Name}
            </span>
            {f.correct_person === 2 && <span className="text-rose-500 text-xs">✓</span>}
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSubmit} disabled={isLoading || !f.text.trim()} className="btn-primary py-2 px-4 text-sm">
          {isLoading ? '...' : submitLabel}
        </button>
        {onCancel && <button onClick={onCancel} className="btn-secondary py-2 px-4 text-sm">Cancelar</button>}
      </div>
    </div>
  )
}

export default function AdivinaQuestionManager({ adivinaEventId, person1Name, person2Name, onQuestionsChange }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)

  useEffect(() => { fetchQuestions() }, [adivinaEventId])

  async function fetchQuestions() {
    const { data } = await supabase
      .from('adivina_questions')
      .select('*')
      .eq('adivina_event_id', adivinaEventId)
      .order('position', { ascending: true })
    if (data) { setQuestions(data); onQuestionsChange?.(data) }
    setLoading(false)
  }

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })) }
  function setEditField(key, value) { setEditForm(f => ({ ...f, [key]: value })) }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.text.trim()) return
    setAdding(true)
    const position = questions.length
    const { data, error } = await supabase
      .from('adivina_questions')
      .insert({ adivina_event_id: adivinaEventId, text: form.text.trim(), correct_person: form.correct_person, position })
      .select().single()
    if (error) alert('Error al agregar la pregunta.')
    else {
      const updated = [...questions, data]
      setQuestions(updated)
      onQuestionsChange?.(updated)
      setForm(emptyForm())
    }
    setAdding(false)
  }

  async function handleEdit(id) {
    if (!editForm.text.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('adivina_questions')
      .update({ text: editForm.text.trim(), correct_person: editForm.correct_person })
      .eq('id', id).select().single()
    if (!error) { setQuestions(prev => prev.map(q => q.id === id ? data : q)); setEditingId(null) }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta pregunta?')) return
    await supabase.from('adivina_questions').delete().eq('id', id)
    const updated = questions.filter(q => q.id !== id)
    setQuestions(updated)
    onQuestionsChange?.(updated)
  }

  function startEdit(q) {
    setEditingId(q.id)
    setEditForm({ text: q.text, correct_person: q.correct_person })
  }

  const correctName = (person) => person === 1 ? person1Name : person2Name
  const correctColor = (person) => person === 1 ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'

  return (
    <div className="space-y-4">
      <QuestionForm
        f={form} setF={setField}
        onSubmit={handleAdd}
        submitLabel="Agregar pregunta"
        loading={adding}
        person1Name={person1Name}
        person2Name={person2Name}
      />

      {loading && <div className="text-center text-gray-400 py-4 text-sm">Cargando...</div>}

      {!loading && questions.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-400 text-sm">No hay preguntas todavía. Agregá la primera arriba.</p>
        </div>
      )}

      {questions.length > 0 && (
        <button
          onClick={() => setShowQuestions(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>{showQuestions ? 'Ocultar preguntas' : `Ver preguntas (${questions.length})`}</span>
          <span className={`transition-transform duration-200 ${showQuestions ? 'rotate-180' : ''}`}>▾</span>
        </button>
      )}

      {showQuestions && <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={q.id} className="card">
            {editingId === q.id ? (
              <QuestionForm
                f={editForm} setF={setEditField}
                onSubmit={() => handleEdit(q.id)}
                onCancel={() => setEditingId(null)}
                submitLabel="Guardar" loading={saving}
                person1Name={person1Name}
                person2Name={person2Name}
              />
            ) : (
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-300 font-mono mt-0.5 w-5 shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium text-sm">{q.text}</p>
                  <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${correctColor(q.correct_person)}`}>
                    ✓ {correctName(q.correct_person)}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(q)} className="text-gray-300 hover:text-blue-400 text-xs">✏️</button>
                  <button onClick={() => handleDelete(q.id)} className="text-gray-300 hover:text-red-400 text-xs">🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>}
      {questions.length > 0 && !showQuestions && <p className="text-xs text-gray-400 text-right">{questions.length} preguntas cargadas</p>}
    </div>
  )
}
