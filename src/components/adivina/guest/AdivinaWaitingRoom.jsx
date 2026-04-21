export default function AdivinaWaitingRoom({ player, adivinaEvent }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-rose-50 flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-xs">
        <div className="text-6xl animate-float">💍</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-800">{adivinaEvent.name}</h1>
          <p className="text-gray-500 text-sm">Hola, <span className="font-medium">{player.full_name}</span></p>
        </div>

        {/* Protagonistas */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
              {adivinaEvent.person1_photo_url ? (
                <img src={adivinaEvent.person1_photo_url} alt={adivinaEvent.person1_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-blue-400">{adivinaEvent.person1_name[0]?.toUpperCase()}</span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-600">{adivinaEvent.person1_name}</span>
          </div>
          <span className="text-gray-300 font-bold text-lg">vs</span>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-300 bg-rose-100 flex items-center justify-center">
              {adivinaEvent.person2_photo_url ? (
                <img src={adivinaEvent.person2_photo_url} alt={adivinaEvent.person2_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-rose-400">{adivinaEvent.person2_name[0]?.toUpperCase()}</span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-600">{adivinaEvent.person2_name}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            <p className="text-gray-600 font-medium text-sm">Esperando que el anfitrión inicie el juego</p>
          </div>
          <p className="text-gray-400 text-xs">Ya estás registrado. No cierres esta pantalla.</p>
        </div>
      </div>
    </div>
  )
}
