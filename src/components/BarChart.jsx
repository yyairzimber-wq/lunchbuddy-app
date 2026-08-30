import { useEffect, useState } from 'react'

export default function BarChart({ data }) {
  const [grown, setGrown] = useState(false)
  const max = Math.max(...data.map((d) => d.value), 1)

  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div key={d.label} className="bar-chart__row">
          <span className="bar-chart__label">{d.emoji} {d.label}</span>
          <div className="bar-chart__track">
            <div
              className="bar-chart__fill"
              style={{ width: grown ? `${(d.value / max) * 100}%` : 0 }}
            />
          </div>
          <span className="bar-chart__value">{d.value}</span>
        </div>
      ))}
    </div>
  )
}
