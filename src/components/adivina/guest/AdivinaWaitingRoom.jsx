export default function AdivinaWaitingRoom({ player, adivinaEvent }) {
  const p1 = { name: adivinaEvent.person1_name, photo: adivinaEvent.person1_photo_url }
  const p2 = { name: adivinaEvent.person2_name, photo: adivinaEvent.person2_photo_url }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1040] via-[#1e1355] to-[#160e35] flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-xs w-full">

        <div className="relative inline-block">
          <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-2xl scale-150" />
          <img src="/img/adivina.png" alt="Adivina" className="relative w-20 h-20 object-contain mx-auto drop-shadow-lg" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white">Adivina Quién</h1>
          <p className="text-white/50 text-sm">Hola, <span className="text-white/80 font-semibold">{player.full_name}</span></p>
        </div>

        {/* Protagonistas */}
        <div className="flex items-center justify-center gap-6">
          {[p1, p2].map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center
                ${i === 0 ? 'border-blue-400/60 bg-blue-500/20' : 'border-rose-400/60 bg-rose-500/20'}`}>
                {p.photo
                  ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-white">{p.name[0]?.toUpperCase()}</span>
                }
              </div>
              <span className="text-white/70 text-xs font-medium">{p.name}</span>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50"></span>
            <p className="text-white/70 font-medium text-sm">Esperando que el anfitrión inicie</p>
          </div>
          <p className="text-white/30 text-xs">Ya estás registrado. No cierres esta pantalla.</p>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-10 right-8 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute top-28 left-10 w-1.5 h-1.5 bg-purple-300/20 rounded-full" />
        <div className="absolute bottom-24 right-10 w-1 h-1 bg-indigo-300/30 rounded-full" />
      </div>
    </div>
  )
}
