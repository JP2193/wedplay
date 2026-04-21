import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../pages/AdminPage'
import { updateRoomInfo, updateModule } from '../../lib/rooms'
import { MODULES } from '../../lib/modules'

/* ─── Toggle ──────────────────────────────────────────────── */
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

/* ─── EventInfoModal ───────────────────────────────────────── */
function EventInfoModal({ room, onSave, onClose, isFirstTime = false }) {
  const [eventName, setEventName] = useState(room?.event_name || '')
  const [eventDate, setEventDate] = useState(room?.event_date || '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await updateRoomInfo(room.id, { event_name: eventName.trim(), event_date: eventDate || null })
    await onSave()
    setSaving(false)
    if (!isFirstTime) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {isFirstTime ? '¡Bienvenido a WedPlay! 🎉' : 'Configuración del evento'}
            </h2>
            {isFirstTime && (
              <p className="text-sm text-gray-400 mt-0.5">Contanos sobre tu evento para empezar</p>
            )}
          </div>
          {!isFirstTime && (
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Nombre del evento</label>
            <input
              type="text"
              className="input-field"
              placeholder="La boda de Nacho y Flor"
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Fecha del evento</label>
            <input
              type="date"
              className="input-field"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            {!isFirstTime && (
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            )}
            <button
              type="submit"
              disabled={saving || !eventName.trim()}
              className="btn-primary flex-1"
            >
              {saving ? 'Guardando...' : isFirstTime ? 'Empezar →' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── UserMenu ─────────────────────────────────────────────── */
function UserMenu({ session, onConfig, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
          {session.user.email?.[0]?.toUpperCase()}
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
          {/* Email */}
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs text-gray-400 mb-0.5">Sesión iniciada como</p>
            <p className="text-sm font-medium text-gray-700 break-all">{session.user.email}</p>
          </div>
          {/* Options */}
          <button
            type="button"
            onClick={() => { setOpen(false); onConfig() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración del evento
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── RoomDashboard ────────────────────────────────────────── */
export default function RoomDashboard() {
  const navigate = useNavigate()
  const { session, room, refreshRoom } = useAdmin()
  const [copied, setCopied] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [modulesState, setModulesState] = useState(() => {
    const map = {}
    room?.room_modules?.forEach(m => { map[m.module_key] = m })
    return map
  })

  // First-time setup: show event info modal if name is empty or blank
  const isFirstTime = !room?.event_name?.trim()

  useEffect(() => {
    if (!room) return
    const map = {}
    room.room_modules?.forEach(m => { map[m.module_key] = m })
    setModulesState(map)
  }, [room?.id])

  async function handleToggle(moduleKey, field, value) {
    const changes = { [field]: value }
    if (field === 'is_visible' && !value) changes.is_enabled = false
    if (field === 'is_enabled' && value) changes.is_visible = true

    setModulesState(prev => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], ...changes }
    }))

    await updateModule(room.id, moduleKey, changes)
  }

  function copyCode() {
    navigator.clipboard.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">Error al cargar el cuarto.</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/img/wedplay.png" alt="WedPlay" className="w-8 h-8 object-contain" />
            <div className="leading-tight">
              <p className="font-bold text-gray-800 text-sm leading-none">Panel Admin</p>
              {room.event_name && (
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-40">{room.event_name}</p>
              )}
            </div>
          </div>

          <UserMenu
            session={session}
            onConfig={() => setShowConfig(true)}
            onLogout={() => supabase.auth.signOut()}
          />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-12">
        {/* Room code card */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white text-center shadow-lg">
          <p className="text-rose-200 text-xs font-medium uppercase tracking-wider mb-2">Código del cuarto</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-black tracking-[0.2em] font-mono">{room.code}</span>
            <button
              type="button"
              onClick={copyCode}
              className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors cursor-pointer"
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
          {room.event_name && (
            <p className="text-white/80 text-sm font-medium mt-2">{room.event_name}</p>
          )}
          {room.event_date && (
            <p className="text-rose-200 text-xs mt-1">
              {new Date(room.event_date + 'T00:00:00').toLocaleDateString('es-AR', { dateStyle: 'long' })}
            </p>
          )}
          <p className="text-rose-200 text-xs mt-3">Compartí este código con tus invitados</p>
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
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-lg ${!isVisible ? 'opacity-40' : ''}`}>
                      {mod.emoji}
                    </div>

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

                      <div className="flex items-center gap-5 mt-3 flex-wrap">
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

                    {mod.implemented && isVisible && (
                      <Link
                        to={mod.adminPath}
                        className="flex-shrink-0 text-xs font-medium text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors no-underline"
                      >
                        Configurar →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Event info modal — first time OR from config menu */}
      {(isFirstTime || showConfig) && (
        <EventInfoModal
          room={room}
          isFirstTime={isFirstTime}
          onSave={refreshRoom}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}
