import { useEffect, useState } from 'react'

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 900)
    const doneTimer = setTimeout(onDone, 1200)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div className={`splash${leaving ? ' splash--leaving' : ''}`}>
      <div className="splash__logo">🍽️</div>
      <div className="splash__title">LunchBuddy</div>
    </div>
  )
}
