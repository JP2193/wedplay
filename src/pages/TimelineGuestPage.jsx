import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode, getGuestName } from '../lib/rooms'

export default function TimelineGuestPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const name = getGuestName(code)
    if (!name) { navigate(`/${code}`, { replace: true }); return }

    getRoomByCode(code).then(r => {
      if (!r) { navigate('/', { replace: true }); return }
      setRoom(r)
      supabase
        .from('timeline_moments')
        .select('*')
        .eq('room_id', r.id)
        .order('position', { ascending: true })
        .then(({ data }) => {
          if (data) setMoments(data)
          setLoading(false)
        })
    })
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-blue-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <div>
              <h1 className="font-semibold text-gray-800 leading-none">Timeline</h1>
              {room?.event_name && (
                <p className="text-xs text-gray-400 mt-0.5">{room.event_name}</p>
              )}
            </div>
          </div>
          <button onClick={() => navigate(`/${code}`)} className="btn-ghost text-sm">← Lobby</button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 pb-12">
        {moments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-gray-500 font-medium">La historia todavía no está disponible</p>
            <p className="text-gray-400 text-sm mt-1">Los novios están preparando su timeline</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-blue-200" />

            <div className="space-y-6">
              {moments.map((moment, idx) => (
                <div key={moment.id} className="flex gap-5 relative">
                  {/* Dot */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-sm z-10">
                    {idx + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-blue-100 mb-1">
                    {moment.moment_date && (
                      <p className="text-xs text-blue-500 font-medium mb-1">
                        {new Date(moment.moment_date + 'T00:00:00').toLocaleDateString('es-AR', { dateStyle: 'long' })}
                      </p>
                    )}
                    <p className="font-semibold text-gray-800 text-sm">{moment.title}</p>
                    {moment.description && (
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{moment.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
