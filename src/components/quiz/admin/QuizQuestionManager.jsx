import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const OPTIONS = ['A', 'B', 'C', 'D']
const OPTION_COLORS = { A: 'bg-blue-50 border-blue-200', B: 'bg-amber-50 border-amber-200', C: 'bg-rose-50 border-rose-200', D: 'bg-emerald-50 border-emerald-200' }
const OPTION_TEXT = { A: 'text-blue-600', B: 'text-amber-600', C: 'text-rose-600', D: 'text-emerald-600' }

function emptyForm() {
  return { text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
}

export default function QuizQuestionManager({ quizEventId }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchQuestions() }, [quizEventId])

  async function fetchQuestions() {
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_event_id', quizEventId)
      .order('position', { ascending: true })
    if (data) setQuestions(data)
    setLoading(false)
  }

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })) }
  function setEditField(key, value) { setEditForm(f => ({ ...f, [key]: value })) }

  const isFormValid = (f) => f.text.trim() && f.option_a.trim() && f.option_b.trim() && f.option_c.trim() && f.option_d.trim()

  async function handleAdd(e) {
    e.preventDefault()
    if (!isFormValid(form)) return
    setAdding(true)
    const position = questions.length
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({ quiz_event_id: quizEventId, ...form, text: form.text.trim(), position })
      .select().single()
    if (error) alert('Error al agregar la pregunta.')
    else { setQuestions(prev => [...prev, data]); setForm(emptyForm()) }
    setAdding(false)
  }

  async function handleEdit(id) {
    if (!isFormValid(editForm)) return
    setSaving(true)
    const { data, error } = await supabase
      .from('quiz_questions')
      .update({ ...editForm, text: editForm.text.trim() })
      .eq('id', id).select().single()
    if (!error) { setQuestions(prev => prev.map(q => q.id === id ? data : q)); setEditingId(null) }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta pregunta?')) return
    await supabase.from('quiz_questions').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  function startEdit(q) {
    setEditingId(q.id)
    setEditForm({ text: q.text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option })
  }

  function QuestionForm({ f, setF, onSubmit, onCancel, submitLabel, loading: isLoading }) {
    return (
      <div className="space-y-3 bg-gray-50 rounded-xl p-4">
        <input
          type="text"
          className="input-field"
          placeholder="Texto de la pregunta..."
          value={f.text}
          onChange={e => setF('text', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          {OPTIONS.map(opt => {
            const key = `option_${opt.toLowerCase()}`
            return (
              <div key={opt} className={`flex items-center gap-2 border rounded-lg p-2 ${OPTION_COLORS[opt]}`}>
                <span className={`font-bold text-sm w-5 shrink-0 ${OPTION_TEXT[opt]}`}>{opt}</span>
                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                  placeholder={`Opción ${opt}...`}
                  value={f[key]}
                  onChange={e => setF(key, e.target.value)}
                />
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Correcta:</span>
          {OPTIONS.map(opt => (
            <label key={opt} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name={`correct-${quizEventId}-${editingId || 'new'}`}
                value={opt}
                checked={f.correct_option === opt}
                onChange={() => setF('correct_option', opt)}
                className="accent-rose-400"
              />
              <span className={`text-sm font-semibold ${OPTION_TEXT[opt]}`}>{opt}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onSubmit} disabled={isLoading || !isFormValid(f)} className="btn-primary py-2 px-4 text-sm">
            {isLoading ? '...' : submitLabel}
          </button>
          {onCancel && <button onClick={onCancel} className="btn-secondary py-2 px-4 text-sm">Cancelar</button>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <QuestionForm f={form} setF={setField} onSubmit={handleAdd} submitLabel="Agregar pregunta" loading={adding} />

      {loading && <div className="text-center text-gray-400 py-4 text-sm">Cargando...</div>}

      {!loading && questions.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-400 text-sm">No hay preguntas todavía. Agregá la primera arriba.</p>
        </div>
      )}

      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={q.id} className="card">
            {editingId === q.id ? (
              <QuestionForm
                f={editForm} setF={setEditField}
                onSubmit={() => handleEdit(q.id)}
                onCancel={() => setEditingId(null)}
                submitLabel="Guardar" loading={saving}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-300 font-mono mt-0.5 w-5 shrink-0">{idx + 1}</span>
                  <p className="flex-1 text-gray-800 font-medium text-sm">{q.text}</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(q)} className="text-gray-300 hover:text-blue-400 text-xs">✏️</button>
                    <button onClick={() => handleDelete(q.id)} className="text-gray-300 hover:text-red-400 text-xs">🗑️</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 ml-8">
                  {OPTIONS.map(opt => {
                    const val = q[`option_${opt.toLowerCase()}`]
                    const isCorrect = q.correct_option === opt
                    return (
                      <div key={opt} className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                        <span className={`font-bold w-4 shrink-0 ${isCorrect ? 'text-emerald-600' : OPTION_TEXT[opt]}`}>{opt}</span>
                        <span className={isCorrect ? 'text-emerald-700 font-medium' : 'text-gray-600'}>{val}</span>
                        {isCorrect && <span className="ml-auto text-emerald-500">✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {questions.length > 0 && <p className="text-xs text-gray-400 text-right">{questions.length} preguntas</p>}
    </div>
  )
}
