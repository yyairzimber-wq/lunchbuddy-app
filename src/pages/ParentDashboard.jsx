import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Baby, BarChart3, ShoppingCart, Moon, Sun, Vote, Cloud, CloudOff, ChefHat } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import { AVATARS } from '../data/foods'
import TabBar from '../components/TabBar'
import BarChart from '../components/BarChart'
import PantryChecklist from '../components/PantryChecklist'
import AddFoodForm from '../components/AddFoodForm'
import { getMakeableFoods } from '../utils/pantry'

const TABS = [
  { id: 'home', label: 'לוח בית', icon: <Home size={18} /> },
  { id: 'kids', label: 'ילדים', icon: <Baby size={18} /> },
  { id: 'kitchen', label: 'מה יש בבית', icon: <ChefHat size={18} /> },
  { id: 'stats', label: 'סטטיסטיקות', icon: <BarChart3 size={18} /> },
  { id: 'shopping', label: 'קניות', icon: <ShoppingCart size={18} /> },
]

export default function ParentDashboard() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { theme, toggleTheme } = useTheme()
  const {
    kids,
    getTodayChoice,
    chooseFood,
    history,
    shoppingList,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    addKidByCode,
    addKidDirect,
    removeKid,
    resetDevice,
    activeVote,
    startVote,
    closeVote,
    applyVoteResult,
    clearVote,
    syncMode,
    pantry,
    togglePantryItem,
    allFoods,
    customFoods,
    addCustomFood,
    removeCustomFood,
  } = useApp()

  const [tab, setTab] = useState('home')
  const [suggestingFor, setSuggestingFor] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [pairCode, setPairCode] = useState('')
  const [pairError, setPairError] = useState('')
  const [addingDirect, setAddingDirect] = useState(false)
  const [directName, setDirectName] = useState('')
  const [directAvatar, setDirectAvatar] = useState(AVATARS[0])
  const [votePicker, setVotePicker] = useState(false)
  const [voteSelection, setVoteSelection] = useState([])
  const [addingFood, setAddingFood] = useState(false)

  const voteChoices = allFoods.slice(0, 12)

  const pairedKids = kids.filter((k) => k.paired)
  const pendingKids = kids.filter((k) => !k.paired)

  const pendingReminders = pairedKids.filter((kid) => !getTodayChoice(kid.id))

  const stats = useMemo(() => {
    const counts = {}
    Object.values(history).forEach((entries) => {
      entries.forEach(({ foodId }) => {
        counts[foodId] = (counts[foodId] || 0) + 1
      })
    })
    return Object.entries(counts)
      .map(([foodId, count]) => ({ food: allFoods.find((f) => f.id === foodId), count }))
      .filter((s) => s.food)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [history, allFoods])

  const chartData = stats.map((s) => ({ label: s.food.name, emoji: s.food.emoji, value: s.count }))
  const makeableFoods = useMemo(() => getMakeableFoods(allFoods, pantry), [allFoods, pantry])

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

  const toggleVoteChoice = (foodId) => {
    setVoteSelection((prev) =>
      prev.includes(foodId) ? prev.filter((id) => id !== foodId) : prev.length < 4 ? [...prev, foodId] : prev
    )
  }

  const handleStartVote = () => {
    if (voteSelection.length < 2) return
    startVote(voteSelection)
    setVoteSelection([])
    setVotePicker(false)
    showToast('ההצבעה המשפחתית התחילה!', '🗳️')
  }

  const handleApplyVote = () => {
    applyVoteResult()
    showToast('הבחירה הוחלה על כל המשפחה', '🎉')
  }

  const handleAddFood = (name, emoji, category) => {
    addCustomFood(name, emoji, category)
    showToast('המאכל נוסף לרשימה!', '🍽️')
  }

  const handleDeleteFood = (food) => {
    removeCustomFood(food.id)
    showToast(`${food.name} נמחק`, '🗑️')
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
                <h2><Vote size={18} /> הצבעה משפחתית</h2>
                {!activeVote && (
                  <button className="btn btn--small" onClick={() => setVotePicker((v) => !v)}>
                    {votePicker ? 'ביטול' : '+ התחל הצבעה'}
                  </button>
                )}
              </div>

              {votePicker && !activeVote && (
                <>
                  <p className="hint-text">בחר/י 2 עד 4 מנות שהמשפחה תצביע ביניהן.</p>
                  <div className="vote-picker-grid">
                    {voteChoices.map((food) => (
                      <button
                        key={food.id}
                        className={`vote-picker-item${voteSelection.includes(food.id) ? ' vote-picker-item--active' : ''}`}
                        onClick={() => toggleVoteChoice(food.id)}
                      >
                        {food.emoji} {food.name}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn btn--primary btn--wide"
                    disabled={voteSelection.length < 2}
                    onClick={handleStartVote}
                  >
                    התחל הצבעה עם {voteSelection.length} אפשרויות
                  </button>
                </>
              )}

              {activeVote && (
                <div className="vote-tally">
                  {activeVote.foodIds.map((foodId) => {
                    const food = allFoods.find((f) => f.id === foodId)
                    const count = Object.values(activeVote.votes).filter((v) => v === foodId).length
                    return (
                      <div key={foodId} className="vote-tally__row">
                        <span>{food.emoji} {food.name}</span>
                        <span className="vote-tally__count">{count} קולות</span>
                      </div>
                    )
                  })}
                  {!activeVote.closed ? (
                    <button className="btn btn--primary btn--wide" onClick={closeVote}>
                      סגור/י הצבעה
                    </button>
                  ) : (
                    <>
                      <p className="vote-tally__winner">
                        🏆 המנצח: {allFoods.find((f) => f.id === activeVote.result)?.emoji}{' '}
                        {allFoods.find((f) => f.id === activeVote.result)?.name}
                      </p>
                      <button className="btn btn--primary btn--wide" onClick={handleApplyVote}>
                        החל/י על כל המשפחה
                      </button>
                    </>
                  )}
                  <button className="btn btn--ghost btn--wide" onClick={clearVote}>
                    בטל/י הצבעה
                  </button>
                </div>
              )}

              {!activeVote && !votePicker && (
                <p className="hint-text">אין הצבעה פעילה כרגע.</p>
              )}
            </section>

            <section className="section">
              <h2>לוח משפחתי</h2>
              {pairedKids.length === 0 && (
                <p className="empty-state">עדיין אין ילדים מחוברים — עברו לטאב "ילדים" כדי להוסיף.</p>
              )}
              <div className="family-board">
                {pairedKids.map((kid) => {
                  const choice = getTodayChoice(kid.id)
                  const food =
                    choice && choice.foodId !== 'skip' ? allFoods.find((f) => f.id === choice.foodId) : null
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
                      {food ? (
                        <div className="family-card__status family-card__status--ok">
                          {food.emoji} {food.name}
                        </div>
                      ) : choice?.foodId === 'skip' ? (
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
                                chooseFood(kid.id, f.id, 'parent')
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

        {tab === 'kitchen' && (
          <div className="tab-fade">
            <section className="section">
              <h2>🧺 מה יש בבית?</h2>
              <p className="hint-text">סמן/י מצרכים שיש בבית, ונציע ארוחות שאפשר להכין מהם.</p>
              <PantryChecklist pantry={pantry} onToggle={togglePantryItem} />
            </section>

            <section className="section">
              <h2>🍽️ אפשר להכין עכשיו</h2>
              {makeableFoods.length === 0 ? (
                <p className="empty-state">סמנו כמה מצרכים כדי לראות הצעות.</p>
              ) : (
                <ul className="stats-list">
                  {makeableFoods.map((f) => (
                    <li key={f.id}>{f.emoji} {f.name}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="section">
              <div className="section__header-row">
                <h2>➕ הוסף מאכל משלך</h2>
                <button className="btn btn--small" onClick={() => setAddingFood((v) => !v)}>
                  {addingFood ? 'ביטול' : '+ הוסף'}
                </button>
              </div>
              {addingFood && <AddFoodForm onAdd={handleAddFood} onClose={() => setAddingFood(false)} />}
              {customFoods.length > 0 && (
                <ul className="kids-list">
                  {customFoods.map((f) => (
                    <li key={f.id}>
                      <span>{f.emoji} {f.name}</span>
                      <button className="btn btn--icon" onClick={() => handleDeleteFood(f)}>
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab === 'stats' && (
          <div className="tab-fade">
            <section className="section">
              <h2>סטטיסטיקות המשפחה</h2>
              {stats.length === 0 ? (
                <p className="empty-state">אין עדיין מספיק נתונים.</p>
              ) : (
                <BarChart data={chartData} />
              )}
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
