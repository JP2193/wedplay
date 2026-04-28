import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../pages/AdminPage'
import { updateModule } from '../../lib/rooms'

/* ─── OptionsMenu ─────────────────────────────────────────── */
function OptionsMenu({ onConfig, onReset, onExport }) {
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
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
        </svg>
        Opciones
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
          <button
            type="button"
            onClick={() => { setOpen(false); onConfig() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cambiar configuración
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onExport() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Exportar PDF
          </button>
          <div className="border-t border-gray-100" />
          <button
            type="button"
            onClick={() => { setOpen(false); onReset() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reiniciar deseos
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── ModeSelector (setup + config) ─────────────────────────── */
function ModeSelector({ currentMod, currentDisplay, onSave, onClose, isSetup = false }) {
  const [mod, setMod] = useState(currentMod || null)
  const [display, setDisplay] = useState(currentDisplay || null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!mod || !display) return
    setSaving(true)
    await onSave(mod, display)
    setSaving(false)
  }

  function OptionBtn({ value, selected, onClick, icon, title, desc }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left rounded-2xl border-2 p-3.5 transition-all ${
          selected ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </div>
          {selected && (
            <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {isSetup ? 'Configurá los deseos' : 'Cambiar configuración'}
          </h2>
          {!isSetup && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          )}
        </div>

        {/* Moderación */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Moderación</p>
          <OptionBtn
            value="auto" selected={mod === 'auto'} onClick={() => setMod('auto')}
            icon="⚡" title="Automática" desc="Los deseos aparecen al instante, sin revisión."
          />
          <OptionBtn
            value="manual" selected={mod === 'manual'} onClick={() => setMod('manual')}
            icon="👁" title="Manual" desc="Aprobás o rechazás cada deseo antes de que aparezca."
          />
        </div>

        <div className="border-t border-gray-100" />

        {/* Vista de invitados */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vista de invitados</p>
          <OptionBtn
            value="masonry" selected={display === 'masonry'} onClick={() => setDisplay('masonry')}
            icon="📋" title="Pizarra" desc="Todos los deseos visibles en mosaico de dos columnas."
          />
          <OptionBtn
            value="carousel" selected={display === 'carousel'} onClick={() => setDisplay('carousel')}
            icon="🎠" title="Rotativo" desc="Un deseo a la vez, cambia automáticamente cada 5 segundos."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!mod || !display || saving}
          className="btn-primary w-full"
        >
          {saving ? 'Guardando...' : isSetup ? 'Confirmar y empezar →' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

/* ─── DeleteModal ─────────────────────────────────────────── */
function DeleteModal({ onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl text-center">
        <div className="text-4xl">🗑️</div>
        <h3 className="font-bold text-gray-800 text-lg">¿Reiniciar todos los deseos?</h3>
        <p className="text-gray-500 text-sm">Se eliminarán todos los mensajes recibidos. Esta acción no se puede deshacer.</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Eliminando...' : 'Sí, reiniciar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── WishCard ────────────────────────────────────────────── */
function WishCard({ wish, moderationMode, onApprove, onReject, onDelete }) {
  const isPending = wish.status === 'pending'
  const isApproved = wish.status === 'approved'
  const isRejected = wish.status === 'rejected'
  const [acting, setActing] = useState(false)

  async function handleApprove() {
    setActing(true)
    await onApprove(wish.id)
    setActing(false)
  }
  async function handleReject() {
    setActing(true)
    await onReject(wish.id)
    setActing(false)
  }
  function handleDelete() {
    if (!window.confirm(`¿Eliminar el deseo de ${wish.guest_name}?`)) return
    onDelete(wish.id)
  }

  return (
    <div className={`card p-4 transition-all ${isRejected ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-sm font-semibold text-rose-500">{wish.guest_name}</p>
            {isPending && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Pendiente</span>
            )}
            {isApproved && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">Aprobado</span>
            )}
            {isRejected && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Rechazado</span>
            )}
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{wish.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(wish.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        {/* Botón eliminar */}
        <button
          onClick={handleDelete}
          className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
          title="Eliminar deseo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {moderationMode === 'manual' && isPending && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleReject}
            disabled={acting}
            className="flex-1 py-2 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            ✗ Rechazar
          </button>
          <button
            onClick={handleApprove}
            disabled={acting}
            className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors disabled:opacity-50"
          >
            ✓ Aprobar
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── DeseosAdminSection ──────────────────────────────────── */
export default function DeseosAdminSection() {
  const navigate = useNavigate()
  const { room } = useAdmin()
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [moderationMode, setModerationMode] = useState(null)
  const [displayMode, setDisplayMode] = useState(null)
  const [showSetup, setShowSetup] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [approvingAll, setApprovingAll] = useState(false)

  useEffect(() => {
    if (!room) return
    const deseosModule = room.room_modules?.find(m => m.module_key === 'deseos')
    const mod = deseosModule?.settings?.moderation_mode ?? null
    const disp = deseosModule?.settings?.display_mode ?? null
    setModerationMode(mod)
    setDisplayMode(disp)
    if (!mod || !disp) setShowSetup(true)

    fetchWishes()

    const channel = supabase
      .channel(`wishes-admin-${room.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'wishes', filter: `room_id=eq.${room.id}` },
        () => fetchWishes()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [room?.id])

  async function fetchWishes() {
    const { data } = await supabase
      .from('wishes')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false })
    if (data) setWishes(data)
    setLoading(false)
  }

  async function handleSaveMode(mod, disp) {
    await updateModule(room.id, 'deseos', { settings: { moderation_mode: mod, display_mode: disp } })
    setModerationMode(mod)
    setDisplayMode(disp)
    setShowSetup(false)
    setShowConfig(false)
  }

  async function handleApprove(wishId) {
    await supabase.rpc('approve_wish', { p_wish_id: wishId })
  }

  async function handleReject(wishId) {
    await supabase.rpc('reject_wish', { p_wish_id: wishId })
  }

  async function handleDelete(wishId) {
    await supabase.rpc('delete_wish', { p_wish_id: wishId })
    setWishes(prev => prev.filter(w => w.id !== wishId))
  }

  async function handleApproveAll() {
    setApprovingAll(true)
    await supabase.rpc('approve_all_wishes', { p_room_id: room.id })
    setApprovingAll(false)
  }

  async function handleReset() {
    setResetting(true)
    await supabase.rpc('reset_wishes', { p_room_id: room.id })
    setWishes([])
    setResetting(false)
    setShowReset(false)
  }

  const pendingCount = wishes.filter(w => w.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate('/admin')} className="text-rose-400 text-sm hover:text-rose-500 flex items-center gap-1">← Panel</button>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {moderationMode && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  moderationMode === 'auto' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {moderationMode === 'auto' ? '⚡ Auto' : '👁 Manual'}
                </span>
              )}
              {displayMode && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                  {displayMode === 'masonry' ? '📋 Pizarra' : '🎠 Rotativo'}
                </span>
              )}
              {room?.code && (
                <button
                  onClick={() => window.open(`/${room.code}/deseos/display`, '_blank')}
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Abrir pantalla
                </button>
              )}
              <OptionsMenu
                onConfig={() => setShowConfig(true)}
                onReset={() => setShowReset(true)}
                onExport={() => room?.code && window.open(`/${room.code}/deseos/print`, '_blank')}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h1 className="font-semibold text-gray-800">Deseos</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 pb-12 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Cargando...</div>
        ) : (
          <>
            {moderationMode === 'manual' && pendingCount > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={approvingAll}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-2xl transition-colors text-sm disabled:opacity-60"
              >
                {approvingAll ? 'Aprobando...' : `✓ Aprobar todos (${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''})`}
              </button>
            )}

            {wishes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-gray-400 text-sm">Aún no hay deseos. Cuando tus invitados los envíen, aparecerán acá.</p>
              </div>
            ) : (
              wishes.map(wish => (
                <WishCard
                  key={wish.id}
                  wish={wish}
                  moderationMode={moderationMode}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDelete}
                />
              ))
            )}
          </>
        )}
      </div>

      {showSetup && (
        <ModeSelector
          isSetup
          currentMod={null} currentDisplay={null}
          onSave={handleSaveMode} onClose={() => {}}
        />
      )}
      {showConfig && (
        <ModeSelector
          currentMod={moderationMode} currentDisplay={displayMode}
          onSave={handleSaveMode} onClose={() => setShowConfig(false)}
        />
      )}
      {showReset && (
        <DeleteModal onConfirm={handleReset} onClose={() => setShowReset(false)} loading={resetting} />
      )}
    </div>
  )
}
