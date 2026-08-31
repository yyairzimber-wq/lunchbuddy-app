import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function FamilyGate() {
  const { createFamily, joinFamily, legacyFamily, migrateLegacyFamily } = useApp()
  const [mode, setMode] = useState(null) // null | 'join'
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [migrating, setMigrating] = useState(false)

  const handleContinueExisting = async () => {
    setMigrating(true)
    await migrateLegacyFamily()
    setMigrating(false)
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    setChecking(true)
    const result = await joinFamily(code)
    setChecking(false)
    if (!result.ok) {
      setError(result.reason === 'invalid' ? 'קוד לא תקין — 6 ספרות' : 'לא נמצאה משפחה עם הקוד הזה')
    }
  }

  return (
    <div className="gate">
      <div className="gate__glow gate__glow--1" />
      <div className="gate__glow gate__glow--2" />
      <div className="gate__content">
        <div className="gate__logo">🍽️</div>
        <h1 className="gate__title">LunchBuddy</h1>
        <p className="gate__subtitle">משפחה חדשה, או הצטרפות למשפחה קיימת?</p>

        {mode !== 'join' ? (
          <div className="gate__cards">
            {legacyFamily && (
              <button className="gate__card" onClick={handleContinueExisting} disabled={migrating}>
                <span className="gate__card-emoji">📦</span>
                <span className="gate__card-title">{migrating ? 'טוען...' : 'המשך עם הנתונים הקיימים'}</span>
                <span className="gate__card-sub">נמצאו נתונים ממשפחה שכבר השתמשה באפליקציה הזו</span>
              </button>
            )}

            <button className="gate__card" onClick={() => createFamily()}>
              <span className="gate__card-emoji">🏠</span>
              <span className="gate__card-title">משפחה חדשה</span>
              <span className="gate__card-sub">אני מקים/ה את המשפחה שלנו באפליקציה</span>
            </button>

            <button className="gate__card" onClick={() => setMode('join')}>
              <span className="gate__card-emoji">🔑</span>
              <span className="gate__card-title">יש לי קוד משפחה</span>
              <span className="gate__card-sub">בן/בת המשפחה שלי כבר הקימו אחת</span>
            </button>
          </div>
        ) : (
          <form className="setup-card" onSubmit={handleJoin}>
            <input
              className="text-input"
              placeholder="קוד משפחה בן 6 ספרות"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              autoFocus
            />
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn btn--primary btn--wide" disabled={checking}>
              {checking ? 'בודק/ת...' : 'הצטרפו למשפחה'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setMode(null)
                setError('')
              }}
            >
              חזרה
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
