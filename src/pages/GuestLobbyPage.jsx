import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName, setGuestName } from '../lib/rooms'
import { MODULES } from '../lib/modules'

function NameModal({ roomCode, onConfirm }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const name = `${firstName.trim()} ${lastName.trim()}`
    if (!firstName.trim() || !lastName.trim()) return
    setGuestName(roomCode, name)
    onConfirm(name)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl mb-2">👋</div>
          <h2 className="text-xl font-bold text-gray-800">¿Cómo te llamás?</h2>
          <p className="text-gray-400 text-sm mt-1">Para que los novios sepan quién sos</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
              <input
                type="text"
                className="input-field"
                placeholder="María"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required autoFocus autoComplete="given-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Apellido</label>
              <input
                type="text"
                className="input-field"
                placeholder="García"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required autoComplete="family-name"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!firstName.trim() || !lastName.trim()}
            className="btn-primary w-full"
          >
            Entrar a la fiesta →
          </button>
        </form>
      </div>
    </div>
  )
}

export default function GuestLobbyPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(undefined) // undefined = loading
  const [guestName, setGuestNameState] = useState(() => getGuestName(code))
  const [showNameModal, setShowNameModal] = useState(false)

  useEffect(() => {
    getRoomByCode(code)
      .then(data => {
        if (!data) {
          navigate('/', { replace: true })
        } else {
          setRoom(data)
          if (!getGuestName(code)) setShowNameModal(true)
        }
      })
      .catch(() => navigate('/', { replace: true }))
  }, [code])

  // Real-time: update modules when admin changes toggles
  useEffect(() => {
    if (!room) return
    const channel = supabase
      .channel(`room-modules-${room.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room_modules', filter: `room_id=eq.${room.id}` },
        payload => {
          setRoom(prev => {
            if (!prev) return prev
            return {
              ...prev,
              room_modules: prev.room_modules.map(m =>
                m.id === payload.new.id ? payload.new : m
              )
            }
          })
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [room?.id])

  if (room === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-violet-100">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  const visibleModules = room.room_modules?.filter(m => m.is_visible) || []
  const moduleMap = {}
  visibleModules.forEach(m => { moduleMap[m.module_key] = m })

  function handleNameConfirm(name) {
    setGuestNameState(name)
    setShowNameModal(false)
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (redirect) navigate(`/${code}/${redirect}`, { replace: true })
  }

  function handleModuleClick(mod) {
    const modState = moduleMap[mod.key]
    if (!modState?.is_enabled) return
    navigate(`/${code}/${mod.key}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-violet-100">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-rose-500 to-amber-400 bg-clip-text text-transparent leading-none">
              WedPlay
            </h1>
            {room.event_name && (
              <p className="text-sm text-gray-500 mt-0.5">{room.event_name}</p>
            )}
          </div>
          {guestName && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Hola,</p>
              <p className="text-sm font-semibold text-gray-700">{guestName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Module grid */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-12">
        {visibleModules.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-gray-500 font-medium">Los juegos están por comenzar</p>
            <p className="text-gray-400 text-sm mt-1">El anfitrión habilitará los módulos pronto</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MODULES.filter(m => moduleMap[m.key]).map(mod => {
              const modState = moduleMap[mod.key]
              const isEnabled = modState?.is_enabled
              const scheduledAt = modState?.scheduled_enable_at
              const scheduledLabel = scheduledAt
                ? new Date(scheduledAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                : null

              return (
                <button
                  key={mod.key}
                  onClick={() => handleModuleClick(mod)}
                  disabled={!isEnabled}
                  className={`relative rounded-3xl overflow-hidden text-left transition-all duration-200 active:scale-95
                    ${isEnabled ? 'shadow-md hover:shadow-lg cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                >
                  {/* Card background */}
                  <div className={`bg-gradient-to-br ${mod.gradient} p-5 min-h-[130px] flex flex-col justify-between`}>
                    {mod.icon
                      ? <img src={mod.icon} alt={mod.name} className="w-10 h-10 object-contain" />
                      : <span className="text-3xl">{mod.emoji}</span>
                    }
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{mod.name}</p>
                      {!isEnabled && (
                        <p className="text-white/70 text-xs mt-0.5">
                          {scheduledLabel ? `Se habilita a las ${scheduledLabel}` : 'Pronto'}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showNameModal && (
        <NameModal roomCode={code} onConfirm={handleNameConfirm} />
      )}
    </div>
  )
}
