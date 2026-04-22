import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

function PhotoUpload({ label, preview, onChange }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">📷</span>
          )}
        </div>
      </div>
      <label className="cursor-pointer text-xs text-rose-400 hover:text-rose-500 font-medium transition-colors">
        {preview ? 'Cambiar foto' : 'Subir foto'}
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      </label>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  )
}

export default function AdivinaCreateModal({ adminId, eventName, onClose, onCreated }) {
  const [person1Name, setPerson1Name] = useState('Novio')
  const [person2Name, setPerson2Name] = useState('Novia')
  const [person1File, setPerson1File] = useState(null)
  const [person2File, setPerson2File] = useState(null)
  const [person1Preview, setPerson1Preview] = useState(null)
  const [person2Preview, setPerson2Preview] = useState(null)
  const [timer, setTimer] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFileChange(e, setFile, setPreview) {
    const file = e.target.files[0]
    if (!file) return
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function uploadPhoto(file, suffix) {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${suffix}.${ext}`
    const { error } = await supabase.storage.from('adivina-photos').upload(fileName, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('adivina-photos').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!person1Name.trim() || !person2Name.trim()) return
    setLoading(true)
    setError(null)

    try {
      let person1PhotoUrl = null
      let person2PhotoUrl = null
      if (person1File) person1PhotoUrl = await uploadPhoto(person1File, 'person1')
      if (person2File) person2PhotoUrl = await uploadPhoto(person2File, 'person2')

      const { data, error: insertError } = await supabase
        .from('adivina_events')
        .insert({
          admin_id: adminId,
          name: eventName || 'Adivina Quién',
          timer_seconds: timer,
          person1_name: person1Name.trim(),
          person2_name: person2Name.trim(),
          person1_photo_url: person1PhotoUrl,
          person2_photo_url: person2PhotoUrl,
        })
        .select()
        .single()

      if (insertError) setError('Error al crear el juego.')
      else onCreated(data)
    } catch (err) {
      setError('Error al subir las fotos: ' + (err?.message ?? JSON.stringify(err)))
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Nuevo Adivina Quién</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Protagonistas</label>
            <div className="flex items-start justify-around gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <PhotoUpload
                  label={person1Name || 'Persona 1'}
                  preview={person1Preview}
                  onChange={e => handleFileChange(e, setPerson1File, setPerson1Preview)}
                />
                <input
                  type="text"
                  className="input-field text-center text-sm"
                  placeholder="Nombre / apodo"
                  value={person1Name}
                  onChange={e => setPerson1Name(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center pt-8">
                <span className="text-gray-300 font-bold text-lg">vs</span>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <PhotoUpload
                  label={person2Name || 'Persona 2'}
                  preview={person2Preview}
                  onChange={e => handleFileChange(e, setPerson2File, setPerson2Preview)}
                />
                <input
                  type="text"
                  className="input-field text-center text-sm"
                  placeholder="Nombre / apodo"
                  value={person2Name}
                  onChange={e => setPerson2Name(e.target.value)}
                  required
                />
              </div>
            </div>
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
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creando...' : 'Crear juego'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
