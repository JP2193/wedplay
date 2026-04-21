import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const LS_KEY = (playerId) => `bingo-answers-${playerId}`

function loadLocalAnswers(playerId, serverAnswers) {
  try {
    const raw = localStorage.getItem(LS_KEY(playerId))
    const local = raw ? JSON.parse(raw) : {}
    return { ...serverAnswers, ...local }
  } catch {
    return serverAnswers || {}
  }
}

function saveLocalAnswers(playerId, answers) {
  try {
    localStorage.setItem(LS_KEY(playerId), JSON.stringify(answers))
  } catch {}
}

function BingoModal({ onBingo, onBack, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onBack} />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs text-center space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">¿Encontraste a todos?</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Si completaste tu cartón, ¡cantá Bingo y avisale al anfitrión!
          </p>
        </div>

        <button
          onClick={onBingo}
          disabled={loading}
          className="w-full py-4 text-2xl font-black tracking-widest rounded-2xl text-white shadow-lg active:scale-95 transition-transform disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #f97066 0%, #fb923c 50%, #fbbf24 100%)' }}
        >
          {loading ? '...' : '🎊 ¡BINGO!'}
        </button>

        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          ← Volver
        </button>
      </div>
    </div>
  )
}

export default function GameScreen({ player, questions, onFinished }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(() => loadLocalAnswers(player.id, player.answers || {}))
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const inputRef = useRef(null)

  const question = questions[current]
  const totalAnswered = Object.values(answers).filter(v => v && v.trim() !== '').length
  const isLast = current === questions.length - 1

  useEffect(() => {
    inputRef.current?.focus()
  }, [current])

  async function persistAnswers(updatedAnswers) {
    setSaving(true)
    await supabase
      .from('players')
      .update({ answers: updatedAnswers })
      .eq('id', player.id)
    setSaving(false)
  }

  function handleAnswerChange(value) {
    const updated = { ...answers, [question.id]: value }
    setAnswers(updated)
    saveLocalAnswers(player.id, updated)
  }

  async function navigate(direction) {
    await persistAnswers(answers)
    if (direction === 'prev' && current > 0) setCurrent(c => c - 1)
    if (direction === 'next' && current < questions.length - 1) setCurrent(c => c + 1)
  }

  async function handleTerminar() {
    // Guardar respuestas y abrir modal
    await persistAnswers(answers)
    setShowModal(true)
  }

  async function handleBingo() {
    setFinishing(true)
    await supabase
      .from('players')
      .update({ finished: true, finished_at: new Date().toISOString(), bingo_called: true })
      .eq('id', player.id)
    localStorage.removeItem(LS_KEY(player.id))
    onFinished()
  }

  if (!question) return null

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex flex-col">
        {/* Header nav */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="px-4 pt-3 pb-1 text-center">
            <span className="text-sm text-gray-400">
              Jugador: <span className="font-semibold text-gray-700">{player.full_name}</span>
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate('prev')}
              disabled={current === 0 || saving}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-30"
            >
              ← Anterior
            </button>

            <span className="text-sm font-medium text-gray-500">
              {current + 1} / {questions.length}
            </span>

            <button
              onClick={() => navigate('next')}
              disabled={isLast || saving}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-30"
            >
              Siguiente →
            </button>
          </div>
        </div>

        {/* Pregunta + respuesta */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
          <div className="space-y-8">
            <div className="text-center">
              <span className="text-xs font-medium text-rose-300 uppercase tracking-widest">
                Pregunta {current + 1}
              </span>
            </div>

            <div className="text-center">
              <p className="text-2xl font-medium text-gray-800 leading-snug">
                {question.text}
              </p>
            </div>

            <div className="space-y-2">
              <input
                ref={inputRef}
                type="text"
                className="input-field text-center text-lg"
                placeholder="Escribí el nombre..."
                value={answers[question.id] || ''}
                onChange={e => handleAnswerChange(e.target.value)}
                autoComplete="off"
              />
              {saving && (
                <p className="text-xs text-gray-300 text-center">Guardando...</p>
              )}
            </div>

            {isLast && (
              <div className="pt-2">
                <button
                  onClick={handleTerminar}
                  disabled={saving}
                  className="btn-primary w-full text-base py-4"
                >
                  Terminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer con contador */}
        <div className="px-4 py-4 border-t border-gray-100 bg-white">
          <p className="text-sm text-center text-gray-400">
            Respuestas: <span className="font-semibold text-rose-400">{totalAnswered}</span>
            <span className="text-gray-300"> / {questions.length}</span>
          </p>
        </div>
      </div>

      {showModal && (
        <BingoModal
          onBingo={handleBingo}
          onBack={() => setShowModal(false)}
          loading={finishing}
        />
      )}
    </>
  )
}
