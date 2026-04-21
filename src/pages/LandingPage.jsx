import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoomByCode } from '../lib/rooms'

export default function LandingPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)

    try {
      const room = await getRoomByCode(code.trim())
      if (!room) {
        setError('Código inválido. Verificá que esté bien escrito.')
        setLoading(false)
        return
      }
      navigate(`/${room.code}`)
    } catch {
      setError('Hubo un error. Intentá de nuevo.')
      setLoading(false)
    }
  }

  function handleCodeChange(e) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (val.length <= 6) setCode(val)
    if (error) setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-violet-100 flex flex-col">
      {/* Admin button — top right, más visible */}
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 font-medium text-sm border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Admin
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-10">
        {/* Logo & title */}
        <div className="flex flex-col items-center text-center mb-10">
          <img
            src="/img/wedplay.png"
            alt="WedPlay"
            className="w-40 sm:w-52 drop-shadow-md mb-5 select-none"
            draggable={false}
          />
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 bg-clip-text text-transparent leading-none mb-2">
            WedPlay
          </h1>
          <p className="text-gray-400 text-base font-medium">
            Juegos para tu boda
          </p>
        </div>

        {/* Code entry card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-7">
            <p className="text-center text-sm font-medium text-gray-500 mb-5">
              Ingresá el código de tu evento
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="ABC123"
                className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] uppercase border-2 border-gray-200 rounded-2xl px-4 py-4 text-gray-800 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all duration-200 bg-gray-50 placeholder-gray-300"
                autoFocus
                autoComplete="off"
                inputMode="text"
              />

              {error && (
                <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || code.length < 4}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-colors duration-200 text-base cursor-pointer"
              >
                {loading ? 'Verificando...' : 'Entrar a la fiesta →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
