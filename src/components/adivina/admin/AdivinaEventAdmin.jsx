import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAdmin } from '../../../pages/AdminPage'
import AdivinaQuestionManager from './AdivinaQuestionManager'
import AdivinaLobby from './AdivinaLobby'
import AdivinaLiveQuestion from './AdivinaLiveQuestion'
import AdivinaLiveRanking from './AdivinaLiveRanking'
import QuizRankingTable from '../../quiz/shared/QuizRankingTable'

/* ─── PhotoUpload (reutilizable) ─────────────────────── */
function PhotoUpload({ label, currentUrl, preview, onChange }) {
  const display = preview || currentUrl
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
        {display
          ? <img src={display} alt={label} className="w-full h-full object-cover" />
          : <span className="text-xl">📷</span>
        }
      </div>
      <label className="cursor-pointer text-xs text-rose-400 font-medium">
        {display ? 'Cambiar' : 'Subir foto'}
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      </label>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

/* ─── ConfigModal ────────────────────────────────────── */
function ConfigModal({ adivinaEvent, onSave, onClose }) {
  const [timer, setTimer] = useState(adivinaEvent.timer_seconds)
  const [p1Name, setP1Name] = useState(adivinaEvent.person1_name)
  const [p2Name, setP2Name] = useState(adivinaEvent.person2_name)
  const [p1File, setP1File] = useState(null)
  const [p2File, setP2File] = useState(null)
  const [p1Preview, setP1Preview] = useState(null)
  const [p2Preview, setP2Preview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFile(e, setFile, setPreview) {
    const file = e.target.files[0]
    if (!file) return
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function uploadPhoto(file, suffix) {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${suffix}.${ext}`
    await supabase.storage.from('adivina-photos').upload(fileName, file, { upsert: true })
    const { data } = supabase.storage.from('adivina-photos').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      const updates = {
        timer_seconds: Math.min(60, Math.max(5, Number(timer))),
        person1_name: p1Name.trim(),
        person2_name: p2Name.trim(),
      }
      if (p1File) updates.person1_photo_url = await uploadPhoto(p1File, 'person1')
      if (p2File) updates.person2_photo_url = await uploadPhoto(p2File, 'person2')

      const { data, error: err } = await supabase
        .from('adivina_events').update(updates).eq('id', adivinaEvent.id).select().single()
      if (err) { setError('Error al guardar.'); setLoading(false); return }
      onSave(data)
    } catch (err) {
      setError('Error al subir fotos: ' + err?.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Configuración</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Protagonistas</p>
          <div className="flex items-start justify-around gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <PhotoUpload label={p1Name} currentUrl={adivinaEvent.person1_photo_url} preview={p1Preview}
                onChange={e => handleFile(e, setP1File, setP1Preview)} />
              <input type="text" className="input-field text-center text-sm" value={p1Name}
                onChange={e => setP1Name(e.target.value)} placeholder="Nombre" />
            </div>
            <div className="flex items-center pt-8">
              <span className="text-gray-300 font-bold">vs</span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <PhotoUpload label={p2Name} currentUrl={adivinaEvent.person2_photo_url} preview={p2Preview}
                onChange={e => handleFile(e, setP2File, setP2Preview)} />
              <input type="text" className="input-field text-center text-sm" value={p2Name}
                onChange={e => setP2Name(e.target.value)} placeholder="Nombre" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Segundos por pregunta</label>
          <input type="number" className="input-field" min={5} max={60} value={timer}
            onChange={e => setTimer(e.target.value)} />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 text-sm">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── DeleteModal ────────────────────────────────────── */
function DeleteModal({ onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl text-center">
        <div className="text-4xl">🗑️</div>
        <h3 className="font-bold text-gray-800 text-lg">¿Eliminar Adivina Quién?</h3>
        <p className="text-gray-500 text-sm">Se eliminarán todas las preguntas, jugadores y respuestas. Esta acción no se puede deshacer.</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancelar</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors">
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── OptionsMenu ────────────────────────────────────── */
function OptionsMenu({ onConfig, onDelete, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors disabled:opacity-40"
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
          <button type="button" onClick={() => { setOpen(false); onConfig() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cambiar configuración
          </button>
          <div className="border-t border-gray-100" />
          <button type="button" onClick={() => { setOpen(false); onDelete() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
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

/* ─── AdivinaEventAdmin ──────────────────────────────── */
export default function AdivinaEventAdmin() {
  const { session, room } = useAdmin()
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [adivinaEvent, setAdivinaEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('setup')
  const [showConfig, setShowConfig] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel(`adivina-event-admin-${eventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'adivina_events', filter: `id=eq.${eventId}` },
        payload => {
          setAdivinaEvent(payload.new)
          if (payload.new.status === 'finished') {
            supabase.from('adivina_players').select('id, full_name, total_score')
              .eq('adivina_event_id', eventId).order('total_score', { ascending: false })
              .then(({ data }) => { if (data) setPlayers(data) })
          }
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [eventId])

  useEffect(() => {
    if (!adivinaEvent || adivinaEvent.status !== 'question' || questions.length > 0) return
    supabase.from('adivina_questions').select('*').eq('adivina_event_id', eventId).order('position')
      .then(({ data }) => { if (data) setQuestions(data) })
  }, [adivinaEvent?.status])

  async function fetchAll() {
    const [evRes, qRes, pRes] = await Promise.all([
      supabase.from('adivina_events').select('*').eq('id', eventId).eq('admin_id', session.user.id).single(),
      supabase.from('adivina_questions').select('*').eq('adivina_event_id', eventId).order('position'),
      supabase.from('adivina_players').select('id, full_name, total_score').eq('adivina_event_id', eventId),
    ])
    if (evRes.error || !evRes.data) { navigate('/admin/adivina'); return }
    setAdivinaEvent(evRes.data)
    if (qRes.data) setQuestions(qRes.data)
    if (pRes.data) setPlayers(pRes.data)
    setLoading(false)
  }

  async function handleReset() {
    if (!window.confirm('¿Reiniciar el juego? Se borrarán todas las respuestas y puntajes.')) return
    await supabase.rpc('reset_adivina_event', { p_adivina_event_id: eventId })
    setTab('lobby')
    await fetchAll()
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('adivina_events').delete().eq('id', eventId)
    navigate('/admin/adivina')
  }

  if (loading || !adivinaEvent) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400 text-sm">Cargando...</div></div>
  }

  const currentQuestion = questions[adivinaEvent.current_question_index]
  const isLive = ['question', 'ranking', 'finished'].includes(adivinaEvent.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate('/admin')} className="text-rose-400 text-sm hover:text-rose-500 flex items-center gap-1">← Panel</button>
            <OptionsMenu
              onConfig={() => setShowConfig(true)}
              onDelete={() => setShowDelete(true)}
              disabled={isLive}
            />
          </div>
          <div className="flex items-center gap-3">
            <img src="/img/adivina.png" alt="Adivina" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="font-bold text-gray-800 text-lg leading-tight">Adivina Quién</h1>
              <p className="text-gray-400 text-xs">
                {adivinaEvent.person1_name} vs {adivinaEvent.person2_name} · {adivinaEvent.timer_seconds}s por pregunta
              </p>
            </div>
          </div>
        </div>
      </header>

      {!isLive && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex border-b border-gray-200 mt-4 gap-6">
            {['setup', 'lobby'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-rose-400 text-rose-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {t === 'setup' ? 'Preguntas' : 'Sala de espera'}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-5">
        {adivinaEvent.status === 'lobby' && tab === 'setup' && (
          <AdivinaQuestionManager
            adivinaEventId={eventId}
            person1Name={adivinaEvent.person1_name}
            person2Name={adivinaEvent.person2_name}
            onQuestionsChange={setQuestions}
          />
        )}

        {adivinaEvent.status === 'lobby' && tab === 'lobby' && (
          <AdivinaLobby adivinaEvent={adivinaEvent} room={room} onStart={() => setTab('live')} />
        )}

        {adivinaEvent.status === 'question' && currentQuestion && (
          <AdivinaLiveQuestion
            adivinaEvent={adivinaEvent}
            question={currentQuestion}
            totalPlayers={players.length}
            onTimeUp={() => {}}
          />
        )}

        {adivinaEvent.status === 'ranking' && (
          <AdivinaLiveRanking
            adivinaEvent={adivinaEvent}
            totalQuestions={questions.length}
            onNext={() => {}}
            onFinish={() => {}}
          />
        )}

        {adivinaEvent.status === 'finished' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">🏁 Ranking final</h3>
              <button onClick={handleReset} className="btn-secondary text-sm py-2 px-4">↺ Reiniciar</button>
            </div>
            <QuizRankingTable players={players} />
          </div>
        )}
      </main>

      {showConfig && (
        <ConfigModal
          adivinaEvent={adivinaEvent}
          onSave={updated => { setAdivinaEvent(updated); setShowConfig(false) }}
          onClose={() => setShowConfig(false)}
        />
      )}
      {showDelete && (
        <DeleteModal
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
          loading={deleting}
        />
      )}
    </div>
  )
}
