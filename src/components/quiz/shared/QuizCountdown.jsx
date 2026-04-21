import { useEffect, useState } from 'react'

export default function QuizCountdown({ totalSeconds, startedAt, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    function tick() {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
      const left = Math.max(0, totalSeconds - elapsed)
      setRemaining(left)
      if (left <= 0) onExpire?.()
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
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="rotate-[-90deg]">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="5" />
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
      <span className="text-2xl font-bold tabular-nums -mt-12 text-gray-700">
        {Math.ceil(remaining)}
      </span>
    </div>
  )
}
