import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../pages/AdminPage'
import QuestionList from './QuestionList'
import FinishedPlayers from './FinishedPlayers'

/* ─── ConfigModal ──────────────────────────────────────────── */
function ConfigModal({ event, onClose, onSaved }) {
  const wasDynamic = event.dynamic_mode

  const [dynamicMode, setDynamicMode] = useState(wasDynamic)
  const [questionsPerPlayer, setQuestionsPerPlayer] = useState(
    wasDynamic ? (event.easy_count + event.hard_count) : event.questions_per_player
  )
  const [easyCount, setEasyCount] = useState(event.easy_count ?? 7)
  const [hardCount, setHardCount] = useState(event.hard_count ?? 3)
  const [saving, setSaving] = useState(false)

  const modeChanged = dynamicMode !== wasDynamic
  const totalDynamic = easyCount + hardCount

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    const updates = dynamicMode
      ? { dynamic_mode: true, easy_count: easyCount, hard_count: hardCount, questions_per_player: totalDynamic }
      : { dynamic_mode: false, easy_count: null, hard_count: null, questions_per_player: questionsPerPlayer }

    await supabase.from('events').update(updates).eq('id', event.id)

    // Si cambió el modo, actualizar dificultades de preguntas
    if (modeChanged) {
      if (!dynamicMode) {
        // Dinámico → No dinámico: quitar dificultad
        await supabase.from('questions').update({ difficulty: null }).eq('event_id', event.id)
      } else {
        // No dinámico → Dinámico: todas en 'easy'
        await supabase.from('questions').update({ difficulty: 'easy' }).eq('event_id', event.id)
      }
    }

    await onSaved()
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Configuración del Bingo</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Toggle modo dinámico */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Modo dinámico</span>
              <button
                type="button"
                onClick={() => setDynamicMode(d => !d)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dynamicMode ? 'bg-rose-400' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${dynamicMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Advertencia si cambia el modo */}
            {modeChanged && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-amber-700 text-xs leading-snug">
                  {dynamicMode
                    ? 'Todas las preguntas existentes quedarán en modo Fácil. Podés reasignar las Difíciles manualmente después.'
                    : 'Se eliminarán las dificultades asignadas a todas las preguntas.'}
                </p>
              </div>
            )}

            {/* Inputs según modo */}
            {!dynamicMode ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preguntas por jugador</label>
                <input
                  type="number"
                  className="input-field"
                  min={1} max={100}
                  value={questionsPerPlayer}
                  onChange={e => setQuestionsPerPlayer(Number(e.target.value))}
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-emerald-600 mb-1">Preguntas fáciles</label>
                  <input
                    type="number"
                    className="input-field border-emerald-200 focus:ring-emerald-300"
                    min={0} max={100}
                    value={easyCount}
                    onChange={e => setEasyCount(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-orange-500 mb-1">Preguntas difíciles</label>
                  <input
                    type="number"
                    className="input-field border-orange-200 focus:ring-orange-300"
                    min={0} max={100}
                    value={hardCount}
                    onChange={e => setHardCount(Number(e.target.value))}
                    required
                  />
                </div>
                <p className="col-span-2 text-xs text-gray-400 text-center -mt-1">
                  Total por jugador: <span className="font-semibold text-gray-600">{totalDynamic}</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── DeleteModal ──────────────────────────────────────────── */
function DeleteModal({ eventId, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('events').delete().eq('id', eventId)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">¿Eliminar el juego?</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Se eliminarán todas las preguntas y los datos de los jugadores actuales. Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} disabled={deleting} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl py-2.5 transition-colors disabled:opacity-60"
          >
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── OptionsMenu ──────────────────────────────────────────── */
function OptionsMenu({ onConfig, onDelete }) {
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
          <div className="border-t border-gray-100" />
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar juego
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── EventDetail ──────────────────────────────────────────── */
export default function EventDetail() {
  const { session } = useAdmin()
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('questions')
  const [showConfig, setShowConfig] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  async function fetchEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('admin_id', session.user.id)
      .single()

    if (error || !data) {
      navigate('/admin', { replace: true })
      return
    }
    setEvent(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/admin')}
              className="text-rose-400 text-sm hover:text-rose-500 flex items-center gap-1"
            >
              ← Panel
            </button>
            <OptionsMenu
              onConfig={() => setShowConfig(true)}
              onDelete={() => setShowDelete(true)}
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <img src="/img/bingoh.png" alt="Bingo Humano" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="font-semibold text-gray-800 text-lg leading-tight">Bingo Humano</h1>
              <p className="text-xs text-gray-400">
                {event.dynamic_mode
                  ? `${event.easy_count} fáciles + ${event.hard_count} difíciles por jugador`
                  : `${event.questions_per_player} preguntas/jugador`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex border-b border-gray-200 mt-4 gap-6">
          <button
            onClick={() => setTab('questions')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'questions'
                ? 'border-rose-400 text-rose-500'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Preguntas
          </button>
          <button
            onClick={() => setTab('finished')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'finished'
                ? 'border-rose-400 text-rose-500'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Finalizados
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {tab === 'questions' && <QuestionList event={event} />}
        {tab === 'finished' && <FinishedPlayers eventId={eventId} />}
      </main>

      {showConfig && (
        <ConfigModal
          event={event}
          onClose={() => setShowConfig(false)}
          onSaved={fetchEvent}
        />
      )}

      {showDelete && (
        <DeleteModal
          eventId={eventId}
          onClose={() => setShowDelete(false)}
          onDeleted={() => navigate('/admin/bingo', { replace: true })}
        />
      )}
    </div>
  )
}
