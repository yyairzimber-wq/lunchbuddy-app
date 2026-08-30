import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Baby, ShoppingCart, Moon, Sun, Vote, Cloud, CloudOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import { AVATARS, CATEGORIES } from '../data/foods'
import TabBar from '../components/TabBar'
import { formatDateHebrew } from '../utils/date'

const TABS = [
  { id: 'home', label: 'לוח בית', icon: <Home size={18} /> },
  { id: 'kids', label: 'ילדים', icon: <Baby size={18} /> },
  { id: 'shopping', label: 'קניות', icon: <ShoppingCart size={18} /> },
]

export default function ParentDashboard() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { theme, toggleTheme } = useTheme()
  const {
    kids,
    getTodayChoices,
    toggleTodayFood,
    shoppingList,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    addKidByCode,
    addKidDirect,
    removeKid,
    resetDevice,
    poll,
    startPoll,
    closePoll,
    clearPoll,
    syncMode,
    allFoods,
    todayMenuText,
    setTodayMenu,
  } = useApp()

  const [tab, setTab] = useState('home')
  const [suggestingFor, setSuggestingFor] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [pairCode, setPairCode] = useState('')
  const [pairError, setPairError] = useState('')
  const [addingDirect, setAddingDirect] = useState(false)
  const [directName, setDirectName] = useState('')
  const [directAvatar, setDirectAvatar] = useState(AVATARS[0])
  const [pollPicker, setPollPicker] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [menuDraft, setMenuDraft] = useState(todayMenuText)

  useEffect(() => {
    setMenuDraft(todayMenuText)
  }, [todayMenuText])

  const pairedKids = kids.filter((k) => k.paired)
  const pendingKids = kids.filter((k) => !k.paired)

  const pendingReminders = pairedKids.filter((kid) => {
    const choice = getTodayChoices(kid.id)
    return choice.foodIds.length === 0 && !choice.skip
  })

  const handleAddItem = (e) => {
    e.preventDefault()
    addShoppingItem(newItem)
    setNewItem('')
  }

  const handlePairSubmit = (e) => {
    e.preventDefault()
    const kid = addKidByCode(pairCode)
    if (kid) {
      setPairCode('')
      setPairError('')
      showToast(`${kid.name} חובר/ה בהצלחה!`, '🔗')
    } else {
      setPairError('קוד לא נמצא — בדוק/י שהוקלד נכון')
    }
  }

  const handleDirectSubmit = (e) => {
    e.preventDefault()
    if (!directName.trim()) return
    addKidDirect(directName.trim(), directAvatar)
    showToast('הילד/ה נוסף/ה', '👶')
    setDirectName('')
    setAddingDirect(false)
  }

  const handleSwitchUser = () => {
    resetDevice()
    navigate('/', { replace: true })
  }

  const updatePollOption = (i, val) => {
    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)))
  }

  const addPollOption = () => {
    setPollOptions((prev) => (prev.length < 6 ? [...prev, ''] : prev))
  }

  const removePollOption = (i) => {
    setPollOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleStartPoll = () => {
    const cleaned = pollOptions.map((o) => o.trim()).filter(Boolean)
    if (!pollQuestion.trim() || cleaned.length < 2) return
    startPoll(pollQuestion.trim(), cleaned)
    setPollQuestion('')
    setPollOptions(['', ''])
    setPollPicker(false)
    showToast('הסקר נשלח למשפחה!', '📊')
  }

  const handleSaveMenu = () => {
    setTodayMenu(menuDraft)
    showToast('העדכון נשמר', '🍲')
  }

  return (
    <div className="app-shell">
      <div className="parent-header">
        <h1>👨‍👩‍👧‍👦 אזור ההורים</h1>
        <div className="parent-header__actions">
          <span className={`sync-badge${syncMode === 'cloud' ? ' sync-badge--cloud' : ''}`}>
            {syncMode === 'cloud' ? <Cloud size={14} /> : <CloudOff size={14} />}
            {syncMode === 'cloud' ? 'מסונכרן' : 'מקומי בלבד'}
          </span>
          <button className="btn btn--icon" onClick={toggleTheme} aria-label="החלף ערכת נושא">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn btn--ghost btn--small" onClick={handleSwitchUser}>
            🔄 החלף משתמש
          </button>
        </div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} position="top" />

      <div className="screen screen--shell" key={tab}>
        {tab === 'home' && (
          <div className="tab-fade">
            {pendingReminders.length > 0 && (
              <div className="reminder-banner">
                ⏰ עדיין לא בחרו היום: {pendingReminders.map((k) => `${k.avatar} ${k.name}`).join(', ')}
              </div>
            )}

            <section className="section">
              <div className="section__header-row">
                <h2><Vote size={18} /> סקר משפחתי</h2>
                {!poll && (
                  <button className="btn btn--small" onClick={() => setPollPicker((v) => !v)}>
                    {pollPicker ? 'ביטול' : '+ סקר חדש'}
                  </button>
                )}
              </div>

              {pollPicker && !poll && (
                <div className="poll-form">
                  <p className="hint-text">כתוב/י שאלה וכמה אפשרויות (במלל חופשי) — בדיוק כמו סקר בוואטסאפ.</p>
                  <input
                    className="text-input"
                    placeholder="השאלה שלך... (למשל: מה נאכל הערב?)"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                  />
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="poll-option-row">
                      <input
                        className="text-input"
                        placeholder={`אפשרות ${i + 1}...`}
                        value={opt}
                        onChange={(e) => updatePollOption(i, e.target.value)}
                      />
                      {pollOptions.length > 2 && (
                        <button className="poll-option-row__remove" onClick={() => removePollOption(i)}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button className="btn btn--small" onClick={addPollOption}>
                      + הוסף אפשרות
                    </button>
                  )}
                  <button
                    className="btn btn--primary btn--wide"
                    disabled={!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
                    onClick={handleStartPoll}
                  >
                    שלח/י את הסקר למשפחה
                  </button>
                </div>
              )}

              {poll && (
                <div className="vote-tally">
                  <p className="vote-card__question">{poll.question}</p>
                  {poll.options.map((opt, i) => {
                    const count = Object.values(poll.votes).filter((v) => v === i).length
                    return (
                      <div key={i} className="vote-tally__row">
                        <span>{opt}</span>
                        <span className="vote-tally__count">{count} קולות</span>
                      </div>
                    )
                  })}
                  {!poll.closed ? (
                    <button className="btn btn--primary btn--wide" onClick={closePoll}>
                      סגור/י סקר
                    </button>
                  ) : (
                    <p className="vote-tally__winner">🏆 המנצח: {poll.options[poll.result]}</p>
                  )}
                  <button className="btn btn--ghost btn--wide" onClick={clearPoll}>
                    מחק/י סקר
                  </button>
                </div>
              )}

              {!poll && !pollPicker && <p className="hint-text">אין סקר פעיל כרגע.</p>}
            </section>

            <section className="section">
              <h2>🍲 מה יש לאכול היום</h2>
              <p className="hint-text">{formatDateHebrew()}</p>
              <div className="poll-form">
                <input
                  className="text-input"
                  placeholder="למשל: פסטה ברוטב עגבניות, סלט וקינוח..."
                  value={menuDraft}
                  onChange={(e) => setMenuDraft(e.target.value)}
                />
                <button className="btn btn--primary btn--wide" onClick={handleSaveMenu}>
                  עדכן/י
                </button>
              </div>
            </section>

            <section className="section">
              <h2>מה אני רוצה לאכול היום</h2>
              <p className="hint-text">{formatDateHebrew()}</p>
              {pairedKids.length === 0 && (
                <p className="empty-state">עדיין אין ילדים מחוברים — עברו לטאב "ילדים" כדי להוסיף.</p>
              )}
              <div className="family-board">
                {pairedKids.map((kid) => {
                  const choice = getTodayChoices(kid.id)
                  const chosenFoods = allFoods.filter((f) => choice.foodIds.includes(f.id))
                  const grouped = CATEGORIES.map((cat) => ({
                    ...cat,
                    foods: chosenFoods.filter((f) => f.category === cat.id),
                  })).filter((g) => g.foods.length > 0)
                  return (
                    <div key={kid.id} className="family-card">
                      <div className="family-card__header">
                        {kid.photoUrl ? (
                          <img className="family-card__photo" src={kid.photoUrl} alt="" />
                        ) : (
                          <span>{kid.avatar}</span>
                        )}
                        <span>{kid.name}</span>
                      </div>
                      {grouped.length > 0 ? (
                        <div className="family-card__meals">
                          {grouped.map((g) => (
                            <div key={g.id} className="family-card__meal-row">
                              <strong>{g.emoji} {g.name}:</strong>{' '}
                              {g.foods.map((f) => `${f.emoji} ${f.name}`).join(', ')}
                            </div>
                          ))}
                        </div>
                      ) : choice.skip ? (
                        <div className="family-card__status">לא רוצה לבחור היום</div>
                      ) : (
                        <div className="family-card__status family-card__status--pending">⏰ עדיין לא בחר/ה</div>
                      )}
                      <button className="btn btn--small" onClick={() => setSuggestingFor(kid.id)}>
                        הצע ארוחה
                      </button>
                      {suggestingFor === kid.id && (
                        <div className="suggest-picker">
                          {allFoods.slice(0, 8).map((f) => (
                            <button
                              key={f.id}
                              className="suggest-picker__item"
                              onClick={() => {
                                toggleTodayFood(kid.id, f.id)
                                setSuggestingFor(null)
                                showToast(`ארוחה הוצעה ל${kid.name}`, '🍽️')
                              }}
                            >
                              {f.emoji} {f.name}
                            </button>
                          ))}
                          <button className="btn btn--small" onClick={() => setSuggestingFor(null)}>
                            ביטול
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        )}

        {tab === 'kids' && (
          <div className="tab-fade">
            <section className="section">
              <h2>🔗 חבר/י ילד/ה עם קוד</h2>
              <p className="hint-text">הילד/ה יוצר/ת פרופיל במכשיר שלו/שלה ומקבל/ת קוד בן 6 ספרות. הקלד/י אותו כאן כדי לחבר.</p>
              <form className="shopping-form" onSubmit={handlePairSubmit}>
                <input
                  className="text-input"
                  placeholder="קוד בן 6 ספרות..."
                  value={pairCode}
                  onChange={(e) => setPairCode(e.target.value)}
                />
                <button type="submit" className="btn btn--primary">
                  חבר/י
                </button>
              </form>
              {pairError && <p className="error-text">{pairError}</p>}
            </section>

            {pendingKids.length > 0 && (
              <section className="section">
                <h2>⏳ ממתינים לאישור</h2>
                <ul className="pending-list">
                  {pendingKids.map((kid) => (
                    <li key={kid.id}>
                      {kid.avatar} {kid.name} — קוד: <strong>{kid.code}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="section">
              <div className="section__header-row">
                <h2>הילדים שלי</h2>
                <button className="btn btn--small" onClick={() => setAddingDirect((v) => !v)}>
                  {addingDirect ? 'ביטול' : '+ הוסף ישירות'}
                </button>
              </div>

              {addingDirect && (
                <form className="add-kid-form" onSubmit={handleDirectSubmit}>
                  <div className="avatar-picker">
                    {AVATARS.map((a) => (
                      <button
                        type="button"
                        key={a}
                        className={`avatar-option${directAvatar === a ? ' avatar-option--active' : ''}`}
                        onClick={() => setDirectAvatar(a)}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <input
                    className="text-input"
                    placeholder="שם הילד/ה"
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                  />
                  <button type="submit" className="btn btn--primary">
                    הוסף
                  </button>
                </form>
              )}

              <ul className="kids-list">
                {pairedKids.map((kid) => (
                  <li key={kid.id}>
                    <span className="kids-list__identity">
                      {kid.photoUrl ? (
                        <img className="kids-list__photo" src={kid.photoUrl} alt="" />
                      ) : (
                        <span>{kid.avatar}</span>
                      )}
                      {kid.name}
                    </span>
                    <button className="btn btn--icon" onClick={() => removeKid(kid.id)}>
                      ✕
                    </button>
                  </li>
                ))}
                {pairedKids.length === 0 && <li className="empty-state">אין עדיין ילדים מחוברים</li>}
              </ul>
            </section>
          </div>
        )}

        {tab === 'shopping' && (
          <div className="tab-fade">
            <section className="section">
              <h2>🛒 רשימת קניות</h2>
              <form className="shopping-form" onSubmit={handleAddItem}>
                <input
                  className="text-input"
                  placeholder="הוסף מוצר..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                />
                <button type="submit" className="btn btn--primary">
                  הוסף
                </button>
              </form>
              <ul className="shopping-list">
                {shoppingList.map((item) => (
                  <li key={item.id} className={item.done ? 'shopping-item--done' : ''}>
                    <label>
                      <input type="checkbox" checked={item.done} onChange={() => toggleShoppingItem(item.id)} />
                      {item.text}
                    </label>
                    <button className="btn btn--icon" onClick={() => removeShoppingItem(item.id)}>
                      ✕
                    </button>
                  </li>
                ))}
                {shoppingList.length === 0 && <li className="empty-state">הרשימה ריקה</li>}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
