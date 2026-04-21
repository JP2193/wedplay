export default function ThankYouScreen({ onModify }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-xs w-full">
        <div className="text-7xl">🎊</div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-800">¡Gracias por jugar!</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Tus respuestas fueron guardadas. ¡Ahora a buscar a esas personas en la fiesta!
          </p>
        </div>
        <div className="pt-2 text-4xl">💍✨</div>

        <button
          onClick={onModify}
          className="btn-ghost w-full text-sm text-gray-400 hover:text-gray-600"
        >
          ✏️ Modificar mis respuestas
        </button>
      </div>
    </div>
  )
}
