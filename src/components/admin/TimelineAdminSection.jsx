import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../pages/AdminPage'

export default function TimelineAdminSection() {
  const navigate = useNavigate()
  const { room } = useAdmin()
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', moment_date: '' })
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!room) return
    fetchMoments()
  }, [room?.id])

  async function fetchMoments() {
    const { data } = await supabase
      .from('timeline_moments')
      .select('*')
      .eq('room_id', room.id)
      .order('position', { ascending: true })
    if (data) setMoments(data)
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setAdding(true)

    const { data, error } = await supabase
      .from('timeline_moments')
      .insert({
        room_id: room.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        moment_date: form.moment_date || null,
        position: moments.length,
      })
      .select()
      .single()

    if (!error && data) {
      setMoments(prev => [...prev, data])
      setForm({ title: '', description: '', moment_date: '' })
      setShowForm(false)
    }
    setAdding(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este momento?')) return
    await supabase.from('timeline_moments').delete().eq('id', id)
    setMoments(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h1 className="font-semibold text-gray-800">Timeline</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2 px-4">
              + Agregar
            </button>
            <button onClick={() => navigate('/admin')} className="btn-ghost text-sm">← Volver</button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 pb-12">
        {showForm && (
          <div className="card mb-5 border-2 border-rose-100">
            <h3 className="font-semibold text-gray-800 mb-4">Nuevo momento</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Título *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Primer viaje juntos"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.moment_date}
                  onChange={e => setForm(f => ({ ...f, moment_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Contá qué pasó..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={adding || !form.title.trim()} className="btn-primary flex-1">
                  {adding ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Cargando...</div>
        ) : moments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📖</div>
            <p className="text-gray-400 text-sm">No hay momentos en el timeline. ¡Empezá contando su historia!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {moments.map((moment, idx) => (
              <div key={moment.id} className="card flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {moment.moment_date && (
                    <p className="text-xs text-blue-400 font-medium mb-0.5">
                      {new Date(moment.moment_date + 'T00:00:00').toLocaleDateString('es-AR', { dateStyle: 'long' })}
                    </p>
                  )}
                  <p className="font-semibold text-gray-800 text-sm">{moment.title}</p>
                  {moment.description && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{moment.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(moment.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
