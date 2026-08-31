import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  {
    icon: '🎯',
    title: 'הילדים בוחרים בעצמם',
    text: 'לפי קטגוריה, חיפוש, או פשוט "תבחר לי" כשלא בא להם להחליט. הבחירה שלהם — ההרגשה שלהם.',
  },
  {
    icon: '❤️ ⭐',
    title: 'מועדפים ודירוגים',
    text: 'כל ילד/ה מסמן/ת מה שהוא אוהב/ת ומדרג/ת מה שניסה/תה — והאפליקציה זוכרת בשבילכם.',
  },
  {
    icon: '🔥 🌟',
    title: 'רצף יומי ואתגר שבועי',
    text: 'בחירה כל יום שומרת על הרצף פעיל, ואתגר חדש כל שבוע. גיימיפיקציה שגורמת להם לחזור.',
  },
  {
    icon: '🗳️',
    title: 'הצבעה משפחתית',
    text: 'ההורה מציע 2–4 אפשרויות, כל ילד/ה מצביע/ה, והתוצאה חלה אוטומטית על כולם. סוף לוויכוחים על מה אוכלים.',
  },
  {
    icon: '📊',
    title: 'אזור הורים מלא',
    text: 'לוח משפחתי, תזכורות למי שעוד לא בחר/ה, הצעת ארוחה אישית, סטטיסטיקות עם גרפים, ורשימת קניות משותפת.',
  },
]

const STEPS = [
  { num: 1, icon: '🍽️', title: 'הילד/ה בוחר/ת', text: 'פותחים את האפליקציה, בוחרים אוכל מהרשימה — או לוחצים "תבחר לי" כשלא בא להחליט.' },
  { num: 2, icon: '🗳️', title: 'ההורה מנהל/ת', text: 'עוקבים אחרי הבחירות, שולחים תזכורת למי שעוד לא בחר/ה, או פותחים הצבעה משפחתית.' },
  { num: 3, icon: '🛒', title: 'הרשימה מתעדכנת', text: 'רשימת הקניות המשפחתית מתעדכנת לבד, לפי מה שנבחר ונקבע באפליקציה.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const handleCta = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
    }
    navigate('/')
  }

  return (
    <div className="landing">
      <div className="landing__glow landing__glow--1" />
      <div className="landing__glow landing__glow--2" />

      {/* Hero */}
      <div className="landing__hero">
        <div className="landing__logo">🍽️</div>
        <h1 className="landing__title">LunchBuddy</h1>
        <p className="landing__tagline">אפליקציה משפחתית לבחירת אוכל לילדים</p>
        <p className="landing__subtitle">
          כל ילד/ה בוחר/ת מה לאכול, ההורים עוקבים ומנהלים — ובלי הוויכוח היומי על מה יש לאכול הערב.
        </p>

        <button className="btn btn--primary btn--cta" onClick={handleCta}>
          {installPrompt ? 'התקינו את לאנצ׳באדי בחינם' : 'התחילו להשתמש בחינם'}
        </button>
        <p className="landing__cta-note">בלי הורדה מהחנות · ישר מהדפדפן · 30 שניות</p>

        {/* product preview, reusing the app's real hero-card / food-card look */}
        <div className="hero-card landing__preview">
          <div className="hero-card__row">
            <div>
              <div className="hero-card__greeting">היי דניאל 👋</div>
              <div className="hero-card__question">מה בא לך לאכול היום?</div>
            </div>
            <div className="streak-badge">
              🔥 5<span>ימים ברצף</span>
            </div>
          </div>

          <div className="food-grid landing__preview-grid">
            <div className="food-card">
              <div className="food-card__emoji">🍝</div>
              <div className="food-card__name">פסטה</div>
            </div>
            <div className="food-card food-card--chosen">
              <div className="food-card__emoji">🌮</div>
              <div className="food-card__name">טאקו</div>
            </div>
            <div className="food-card">
              <div className="food-card__emoji">🍕</div>
              <div className="food-card__name">פיצה</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="landing__section">
        <h2 className="landing__section-title">למה המשפחה שלכם תאהב את זה</h2>
        <p className="landing__section-subtitle">כל מה שצריך כדי להפוך את ארוחות היום-יום לפשוטות יותר</p>

        <div className="landing__features">
          {FEATURES.map((f) => (
            <div className="landing__feature-card" key={f.title}>
              <div className="landing__feature-icon">{f.icon}</div>
              <div className="landing__feature-title">{f.title}</div>
              <div className="landing__feature-text">{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="landing__section">
        <h2 className="landing__section-title">איך זה עובד</h2>

        <div className="landing__steps">
          {STEPS.map((s) => (
            <div className="landing__step" key={s.num}>
              <div className="landing__step-num">{s.num}</div>
              <div className="landing__step-body">
                <div className="landing__step-title">
                  {s.title} {s.icon}
                </div>
                <div className="landing__step-text">{s.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="landing__section">
        <div className="landing__final-cta">
          <div className="landing__final-title">מוכנים להפסיק להתווכח על מה אוכלים הערב?</div>
          <p className="landing__final-subtitle">30 שניות התקנה, וזהו — כל המשפחה בפנים.</p>

          <button className="btn btn--primary btn--cta" onClick={handleCta}>
            {installPrompt ? 'התקינו עכשיו — חינם' : 'כנסו עכשיו — חינם'}
          </button>

          <div className="landing__install-steps">
            <div>
              <strong>אנדרואיד:</strong> תפריט ⋮ בדפדפן ← "הוספה למסך הבית"
            </div>
            <div>
              <strong>אייפון:</strong> כפתור שיתוף ⬆️ ← "הוספה למסך הבית"
            </div>
          </div>

          <p className="landing__final-note">עובד גם בלי אינטרנט · בעברית מלאה · ללא עלות</p>
        </div>
      </div>

      <div className="landing__footer">LunchBuddy 🍽️ · נבנה באהבה למשפחות</div>
    </div>
  )
}
