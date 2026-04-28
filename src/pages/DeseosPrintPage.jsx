import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode } from '../lib/rooms'

const CARD_COLORS = [
  '#fff1f2', // rose-50
  '#fffbeb', // amber-50
  '#f5f3ff', // violet-50
  '#ecfdf5', // emerald-50
  '#f0f9ff', // sky-50
]

/* ─── DeseosWishPrintPage ─────────────────────────────── */
export default function DeseosWishPrintPage() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { init() }, [code])

  async function init() {
    const roomData = await getRoomByCode(code)
    if (!roomData) { setError('Cuarto no encontrado.'); setLoading(false); return }
    setRoom(roomData)

    const { data } = await supabase
      .from('wishes').select('*')
      .eq('room_id', roomData.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
    if (data) setWishes(data)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-400 text-sm">Cargando deseos...</p>
    </div>
  )
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <p className="text-gray-500 text-center">{error}</p>
    </div>
  )

  const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      {/* Print button — hidden in print */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg transition-colors"
        >
          🖨️ Imprimir / Guardar PDF
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          Cerrar
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 bg-white min-h-screen">
        {/* Header */}
        <div className="text-center mb-10 border-b border-gray-200 pb-8">
          <div className="text-4xl mb-2">✨</div>
          <h1 className="text-3xl font-bold text-gray-800">
            {room?.name ?? 'Nuestros Deseos'}
          </h1>
          <p className="text-gray-400 text-sm mt-2">{today} · {wishes.length} deseos</p>
        </div>

        {wishes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No hay deseos aprobados todavía.</p>
          </div>
        ) : (
          <div className="columns-2 gap-5">
            {wishes.map((wish, i) => (
              <div
                key={wish.id}
                className="break-inside-avoid mb-5 rounded-2xl p-5"
                style={{ backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }}
              >
                <p className="text-gray-800 text-sm leading-relaxed">
                  <span className="text-2xl leading-none mr-1 opacity-30" style={{ fontFamily: 'Georgia, serif' }}>"</span>
                  {wish.message}
                  <span className="text-2xl leading-none ml-1 opacity-30" style={{ fontFamily: 'Georgia, serif' }}>"</span>
                </p>
                <p className="text-xs font-semibold mt-3 text-gray-500">— {wish.guest_name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-100">
          <p className="text-gray-300 text-xs">Generado con WedPlay</p>
        </div>
      </div>
    </>
  )
}
