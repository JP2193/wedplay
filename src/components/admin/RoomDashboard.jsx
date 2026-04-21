import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../pages/AdminPage'
import { updateRoomInfo, updateModule } from '../../lib/rooms'
import { MODULES } from '../../lib/modules'

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? 'bg-rose-500' : 'bg-gray-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

export default function RoomDashboard() {
  const navigate = useNavigate()
  const { session, room, refreshRoom } = useAdmin()
  const [eventName, setEventName] = useState(room?.event_name || '')
  const [eventDate, setEventDate] = useState(room?.event_date || '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [modulesState, setModulesState] = useState(() => {
    const map = {}
    room?.room_modules?.forEach(m => { map[m.module_key] = m })
    return map
  })

  // Sync if room changes
  useEffect(() => {
    if (!room) return
    setEventName(room.event_name || '')
    setEventDate(room.event_date || '')
    const map = {}
    room.room_modules?.forEach(m => { map[m.module_key] = m })
    setModulesState(map)
  }, [room?.id])

  async function handleSaveInfo(e) {
    e.preventDefault()
    setSaving(true)
    await updateRoomInfo(room.id, { event_name: eventName, event_date: eventDate || null })
    await refreshRoom()
    setSaving(false)
  }

  async function handleToggle(moduleKey, field, value) {
    const changes = { [field]: value }
    // If disabling visibility, also disable enabled
    if (field === 'is_visible' && !value) {
      changes.is_enabled = false
    }
    // If enabling, visibility must be on
    if (field === 'is_enabled' && value) {
      changes.is_visible = true
    }

    // Optimistic update
    setModulesState(prev => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], ...changes }
    }))

    await updateModule(room.id, moduleKey, changes)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function copyCode() {
    navigator.clipboard.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Error al cargar el cuarto.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💍</span>
            <h1 className="font-semibold text-gray-800">Panel Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 truncate max-w-32">{session.user.email}</span>
            <button onClick={handleLogout} className="btn-ghost text-sm">Salir</button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-12">
        {/* Room code card */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white text-center shadow-lg">
          <p className="text-rose-200 text-xs font-medium uppercase tracking-wider mb-2">Código del cuarto</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-black tracking-[0.2em] font-mono">{room.code}</span>
            <button
              onClick={copyCode}
              className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors"
              title="Copiar código"
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-rose-200 text-xs mt-2">Compartí este código con tus invitados</p>
        </div>

        {/* Event info */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Información del evento</h2>
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Nombre del evento</label>
              <input
                type="text"
                className="input-field"
                placeholder="La boda de Nacho y Flor"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Fecha</label>
              <input
                type="date"
                className="input-field"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </div>

        {/* Modules */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-1">Módulos</h2>
          <p className="text-xs text-gray-400 mb-5">Controlá qué ven y pueden usar tus invitados</p>

          <div className="space-y-3">
            {MODULES.map(mod => {
              const modState = modulesState[mod.key] || {}
              const isVisible = modState.is_visible || false
              const isEnabled = modState.is_enabled || false

              return (
                <div
                  key={mod.key}
                  className={`rounded-2xl border p-4 transition-colors duration-200 ${isVisible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Module icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-lg ${!isVisible ? 'opacity-40' : ''}`}>
                      {mod.emoji}
                    </div>

                    {/* Module info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-semibold text-sm ${isVisible ? 'text-gray-800' : 'text-gray-400'}`}>
                          {mod.name}
                        </span>
                        {!mod.implemented && (
                          <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Próximamente</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{mod.description}</p>

                      {/* Toggles */}
                      <div className="flex items-center gap-5 mt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Toggle
                            checked={isVisible}
                            onChange={v => handleToggle(mod.key, 'is_visible', v)}
                            disabled={!mod.implemented}
                          />
                          <span className="text-xs text-gray-500">Visible</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <Toggle
                            checked={isEnabled}
                            onChange={v => handleToggle(mod.key, 'is_enabled', v)}
                            disabled={!mod.implemented || !isVisible}
                          />
                          <span className="text-xs text-gray-500">Habilitado</span>
                        </label>

                        <span className="text-xs text-gray-300 italic">Horario: Próximamente</span>
                      </div>
                    </div>

                    {/* Configure button */}
                    {mod.implemented && isVisible && (
                      <button
                        onClick={() => navigate(mod.adminPath)}
                        className="flex-shrink-0 text-xs font-medium text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Configurar →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
