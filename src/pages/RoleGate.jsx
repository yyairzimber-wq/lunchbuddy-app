import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function RoleGate() {
  const { deviceRole, myKidId, kids, chooseRole } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (deviceRole === 'parent') {
      navigate('/parent', { replace: true })
    } else if (deviceRole === 'child') {
      const kid = kids.find((k) => k.id === myKidId)
      navigate(kid ? `/kid/${myKidId}` : '/child-setup', { replace: true })
    }
  }, [deviceRole, myKidId, kids, navigate])

  if (deviceRole) return null

  return (
    <div className="gate">
      <div className="gate__glow gate__glow--1" />
      <div className="gate__glow gate__glow--2" />
      <div className="gate__content">
        <div className="gate__logo">🍽️</div>
        <h1 className="gate__title">LunchBuddy</h1>
        <p className="gate__subtitle">בחירת האוכל היומית של המשפחה, במקום אחד</p>

        <div className="gate__cards">
          <button
            className="gate__card gate__card--child"
            onClick={() => {
              chooseRole('child')
              navigate('/child-setup')
            }}
          >
            <span className="gate__card-emoji">🧒</span>
            <span className="gate__card-title">אני ילד/ה</span>
            <span className="gate__card-sub">בוחר/ת מה לאכול היום</span>
          </button>

          <button
            className="gate__card gate__card--parent"
            onClick={() => {
              chooseRole('parent')
              navigate('/parent')
            }}
          >
            <span className="gate__card-emoji">🧑‍🤝‍🧑</span>
            <span className="gate__card-title">אני הורה</span>
            <span className="gate__card-sub">עוקב/ת ומנהל/ת את המשפחה</span>
          </button>
        </div>
      </div>
    </div>
  )
}
