import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../pages/AdminPage'

export default function DeseosAdminSection() {
  const navigate = useNavigate()
  const { room } = useAdmin()
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!room) return
    fetchWishes()

    const channel = supabase
      .channel(`wishes-admin-${room.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wishes', filter: `room_id=eq.${room.id}` },
        payload => setWishes(prev => [payload.new, ...prev])
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

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este deseo?')) return
    await supabase.from('wishes').delete().eq('id', id)
    setWishes(prev => prev.filter(w => w.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h1 className="font-semibold text-gray-800">Deseos</h1>
          </div>
          <button onClick={() => navigate('/admin')} className="btn-ghost text-sm">← Volver</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-3 pb-12">
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Cargando...</div>
        ) : wishes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-gray-400 text-sm">Aún no hay deseos. Cuando tus invitados los envíen, aparecerán acá.</p>
          </div>
        ) : (
          wishes.map(wish => (
            <div key={wish.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-rose-500 mb-1">{wish.guest_name}</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{wish.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(wish.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(wish.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
