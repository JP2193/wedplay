import { useEffect, useRef, useState } from 'react'

export default function QuizCountdown({ totalSeconds, startedAt, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
    function tick() {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
      const left = Math.min(totalSeconds, Math.max(0, totalSeconds - elapsed))
      setRemaining(left)
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true
        onExpire?.()
      }
    }

    tick()
    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [startedAt, totalSeconds])

  const pct = remaining / totalSeconds
  const radius = 28
  const circ = 2 * Math.PI * radius
  const dash = circ * pct
  const color = pct > 0.5 ? '#34d399' : pct > 0.25 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative w-[72px] h-[72px]">
      <svg width="72" height="72" className="rotate-[-90deg]">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#ffffff20" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.1s linear, stroke 0.3s' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums text-white">
        {Math.ceil(remaining)}
      </span>
    </div>
  )
}
