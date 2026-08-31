import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { AVATARS } from '../data/foods'

export default function ChildSetup() {
  const { kids, createChildProfile, selectExistingKid } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [creatingNew, setCreatingNew] = useState(kids.length === 0)

  const handlePickExisting = (kidId) => {
    selectExistingKid(kidId)
    navigate(`/kid/${kidId}`, { replace: true })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const id = createChildProfile(name.trim(), avatar)
    navigate(`/kid/${id}`, { replace: true })
  }

  if (!creatingNew) {
    return (
      <div className="gate">
        <div className="gate__glow gate__glow--1" />
        <div className="gate__glow gate__glow--2" />
        <div className="gate__content">
          <div className="gate__logo">🧒</div>
          <h1 className="gate__title">מי אתה/את?</h1>
          <p className="gate__subtitle">בחר/י את עצמך, או התחל/י פרופיל חדש</p>

          <div className="gate__cards">
            {kids.map((kid) => (
              <button key={kid.id} className="gate__card" onClick={() => handlePickExisting(kid.id)}>
                <span className="gate__card-emoji">{kid.avatar}</span>
                <span className="gate__card-title">{kid.name}</span>
              </button>
            ))}
            <button className="gate__card" onClick={() => setCreatingNew(true)}>
              <span className="gate__card-emoji">✨</span>
              <span className="gate__card-title">אני חדש/ה כאן</span>
              <span className="gate__card-sub">עוד לא הייתי באפליקציה</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gate">
      <div className="gate__glow gate__glow--1" />
      <div className="gate__glow gate__glow--2" />
      <div className="gate__content">
        <div className="gate__logo">🧒</div>
        <h1 className="gate__title">בואו נכיר</h1>
        <p className="gate__subtitle">איך קוראים לך, ואיזו דמות תבחר/י?</p>

        <form className="setup-card" onSubmit={handleSubmit}>
          <div className="avatar-picker avatar-picker--big">
            {AVATARS.map((a) => (
              <button
                type="button"
                key={a}
                className={`avatar-option${avatar === a ? ' avatar-option--active' : ''}`}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            className="text-input"
            placeholder="השם שלי..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn--primary btn--wide">
            בואו נתחיל 🚀
          </button>
          {kids.length > 0 && (
            <button type="button" className="btn btn--ghost" onClick={() => setCreatingNew(false)}>
              חזרה
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
