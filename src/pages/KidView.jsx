import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Utensils, CalendarDays, ShoppingCart, User, Moon, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import { CATEGORIES } from '../data/foods'
import CategoryTabs from '../components/CategoryTabs'
import FoodCard from '../components/FoodCard'
import TabBar from '../components/TabBar'
import PollCard from '../components/PollCard'
import RecipeModal from '../components/RecipeModal'
import WeeklyPlanner from '../components/WeeklyPlanner'
import AddFoodForm from '../components/AddFoodForm'
import PhotoPicker from '../components/PhotoPicker'
import { computeStreak, getWeeklyChallenge } from '../utils/stats'
import { getMakeableFoods } from '../utils/pantry'

const TABS = [
  { id: 'choose', label: 'בחירה', icon: <Utensils size={18} /> },
  { id: 'planner', label: 'תכנון שבועי', icon: <CalendarDays size={18} /> },
  { id: 'shopping', label: 'קניות', icon: <ShoppingCart size={18} /> },
  { id: 'profile', label: 'שלי', icon: <User size={18} /> },
]

export default function KidView() {
  const { kidId } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const { theme, toggleTheme } = useTheme()
  const {
    kids,
    favorites,
    ratings,
    toggleFavorite,
    rateFood,
    toggleTodayFood,
    skipToday,
    getTodayChoices,
    history,
    resetDevice,
    poll,
    castPollVote,
    weeklyPlan,
    pantry,
    setWeeklyMeal,
    clearWeeklyMeal,
    allFoods,
    addCustomFood,
    removeCustomFood,
    setKidPhoto,
    shoppingList,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
  } = useApp()

  const kid = kids.find((k) => k.id === kidId)
  const [tab, setTab] = useState('choose')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [suggestion, setSuggestion] = useState(null)
  const [recipeFood, setRecipeFood] = useState(null)
  const [addingFood, setAddingFood] = useState(false)
  const [newItem, setNewItem] = useState('')

  const kidFavorites = favorites[kidId] || []
  const kidRatings = ratings[kidId] || {}
  const kidHistory = history[kidId] || []
  const todayChoice = getTodayChoices(kidId)
  const streak = useMemo(() => computeStreak(kidHistory), [kidHistory])
  const challenge = useMemo(() => getWeeklyChallenge(allFoods, kidRatings), [allFoods, kidRatings])

  const filteredFoods = useMemo(() => {
    return allFoods.filter((food) => {
      if (category !== 'all' && food.category !== category) return false
      if (search.trim() && !food.name.includes(search.trim())) return false
      return true
    })
  }, [allFoods, category, search])

  const favoriteFoods = allFoods.filter((f) => kidFavorites.includes(f.id))
  const kidPlan = weeklyPlan[kidId] || {}
  const makeableFoods = useMemo(() => getMakeableFoods(allFoods, pantry), [allFoods, pantry])

  const chosenFoods = allFoods.filter((f) => todayChoice.foodIds.includes(f.id))
  const chosenByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    foods: chosenFoods.filter((f) => f.category === cat.id),
  })).filter((g) => g.foods.length > 0)

  if (!kid) {
    return (
      <div className="screen">
        <p>ילד/ה לא נמצא/ה.</p>
        <button className="btn" onClick={() => navigate('/')}>
          חזרה
        </button>
      </div>
    )
  }

  const handleToggleFavorite = (id) => {
    const wasFavorite = kidFavorites.includes(id)
    toggleFavorite(kidId, id)
    showToast(wasFavorite ? 'הוסר מהמועדפים' : 'נוסף למועדפים', wasFavorite ? '💔' : '❤️')
  }

  const handleRate = (id, n) => {
    rateFood(kidId, id, n)
    showToast(`דירגת ${n} כוכבים`, '⭐')
  }

  const handleToggleFood = (id) => {
    const wasChosen = todayChoice.foodIds.includes(id)
    toggleTodayFood(kidId, id)
    showToast(wasChosen ? 'הוסר מהבחירות של היום' : 'נוסף לבחירות של היום!', wasChosen ? '➖' : '🎉')
  }

  const handleSkip = () => {
    skipToday(kidId)
    showToast('סימנת שאתה לא רוצה לבחור היום', '🙅')
  }

  const handleVote = (optionIndex) => {
    castPollVote(kidId, optionIndex)
    showToast('ההצבעה שלך נשמרה', '🗳️')
  }

  const pickForMe = () => {
    const pool = filteredFoods.filter((f) => !todayChoice.foodIds.includes(f.id))
    const source = pool.length > 0 ? pool : filteredFoods
    const pick = source[Math.floor(Math.random() * source.length)]
    setSuggestion(pick)
  }

  const handleAddFood = (name, emoji, category) => {
    addCustomFood(name, emoji, category)
    showToast('המאכל נוסף לרשימה!', '🍽️')
  }

  const handleDeleteFood = (food) => {
    removeCustomFood(food.id)
    showToast(`${food.name} נמחק`, '🗑️')
  }

  const handleAddShoppingItem = (e) => {
    e.preventDefault()
    addShoppingItem(newItem)
    setNewItem('')
  }

  const handleSwitchUser = () => {
    resetDevice()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-shell">
      <div className="screen screen--shell" key={tab}>
        {tab === 'choose' && (
          <div className="tab-fade">
            <div className="hero-card">
              <div className="hero-card__row">
                <div className="hero-card__identity">
                  {kid.photoUrl ? (
                    <img className="hero-card__photo" src={kid.photoUrl} alt="" />
                  ) : (
                    <span className="hero-card__avatar-emoji">{kid.avatar}</span>
                  )}
                  <div>
                    <div className="hero-card__greeting">היי, {kid.name}</div>
                    <div className="hero-card__question">מה בא לך לאכול היום?</div>
                  </div>
                </div>
                {streak > 0 && (
                  <div className="streak-badge">
                    🔥 {streak} <span>ימים ברצף</span>
                  </div>
                )}
              </div>
              {!kid.paired && (
                <div className="pairing-banner">
                  ⏳ ממתין/ה לאישור ההורה — הקוד שלך: <strong>{kid.code}</strong>
                </div>
              )}
              {chosenByCategory.length > 0 && (
                <div className="today-banner">
                  {chosenByCategory.map((g) => (
                    <div key={g.id} className="today-banner__group">
                      {g.emoji} <strong>{g.name}:</strong>{' '}
                      {g.foods.map((f) => `${f.emoji} ${f.name}`).join(', ')}
                    </div>
                  ))}
                </div>
              )}
              {todayChoice.skip && (
                <div className="today-banner today-banner--skip">סימנת שאתה לא רוצה לבחור היום 🙅</div>
              )}
            </div>

            {poll && <PollCard poll={poll} kidId={kidId} onVote={handleVote} />}

            {challenge && (
              <div className="challenge-banner">
                🌟 אתגר השבוע: נסה/י לטעום <strong>{challenge.emoji} {challenge.name}</strong>
              </div>
            )}

            {makeableFoods.length > 0 && (
              <div className="challenge-banner">
                🧺 יש בבית מה שצריך בשביל:{' '}
                {makeableFoods
                  .slice(0, 3)
                  .map((f) => `${f.emoji} ${f.name}`)
                  .join(', ')}
              </div>
            )}

            {suggestion && (
              <div className="suggestion-modal">
                <div className="suggestion-modal__card">
                  <p>מה דעתך על:</p>
                  <div className="suggestion-modal__food">
                    {suggestion.emoji} {suggestion.name}
                  </div>
                  <div className="suggestion-modal__actions">
                    <button
                      className="btn btn--primary"
                      onClick={() => {
                        handleToggleFood(suggestion.id)
                        setSuggestion(null)
                      }}
                    >
                      בוחר את זה! ✅
                    </button>
                    <button className="btn" onClick={pickForMe}>
                      נסה שוב 🎲
                    </button>
                    <button className="btn" onClick={() => setSuggestion(null)}>
                      ביטול
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="toolbar">
              <input
                className="text-input"
                placeholder="🔍 חיפוש מאכל..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn--magic" onClick={pickForMe}>
                🎲 תבחר לי
              </button>
            </div>

            <CategoryTabs active={category} onChange={setCategory} />

            <div className="toolbar toolbar--secondary">
              <button className="btn btn--ghost" onClick={() => setAddingFood((v) => !v)}>
                {addingFood ? 'ביטול' : '+ הוסף מאכל משלך'}
              </button>
              <button className="btn btn--ghost" onClick={handleSkip}>
                לא רוצה לבחור היום 🙅
              </button>
            </div>

            {addingFood && <AddFoodForm onAdd={handleAddFood} onClose={() => setAddingFood(false)} />}

            <div className="food-grid">
              {filteredFoods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  isFavorite={kidFavorites.includes(food.id)}
                  rating={kidRatings[food.id] || 0}
                  isChosen={todayChoice.foodIds.includes(food.id)}
                  onChoose={handleToggleFood}
                  onToggleFavorite={handleToggleFavorite}
                  onRate={handleRate}
                  onShowRecipe={setRecipeFood}
                  onDeleteFood={handleDeleteFood}
                />
              ))}
              {filteredFoods.length === 0 && <p className="empty-state">לא נמצאו מאכלים 🤔</p>}
            </div>
          </div>
        )}

        {tab === 'planner' && (
          <div className="tab-fade">
            <h1 className="section-title">📅 תכנון שבועי</h1>
            <WeeklyPlanner
              foods={allFoods}
              plan={kidPlan}
              onSetMeal={(day, foodId) => setWeeklyMeal(kidId, day, foodId)}
              onClearMeal={(day) => clearWeeklyMeal(kidId, day)}
            />
          </div>
        )}

        {tab === 'shopping' && (
          <div className="tab-fade">
            <h1 className="section-title">🛒 רשימת קניות</h1>
            <form className="shopping-form" onSubmit={handleAddShoppingItem}>
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
          </div>
        )}

        {tab === 'profile' && (
          <div className="tab-fade">
            <h1 className="section-title">👤 הפרופיל שלי</h1>
            <div className="profile-card">
              <PhotoPicker
                photoUrl={kid.photoUrl}
                emoji={kid.avatar}
                onChange={(url) => setKidPhoto(kidId, url)}
              />
              <span className="profile-card__name">{kid.name}</span>
              <span className={`profile-card__status${kid.paired ? ' profile-card__status--ok' : ''}`}>
                {kid.paired ? '✓ מחובר/ת להורה' : `⏳ ממתין לאישור — קוד: ${kid.code}`}
              </span>
              {streak > 0 && <span className="profile-card__streak">🔥 {streak} ימים ברצף בחירות</span>}
            </div>
            <button className="btn btn--ghost btn--wide" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {theme === 'dark' ? ' מצב בהיר' : ' מצב כהה'}
            </button>
            <button className="btn btn--ghost btn--wide" onClick={handleSwitchUser}>
              🔄 החלף משתמש
            </button>

            <h2 className="section-title" style={{ marginTop: 28 }}>
              ❤️ המועדפים שלי
            </h2>
            <div className="food-grid">
              {favoriteFoods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  isFavorite
                  rating={kidRatings[food.id] || 0}
                  isChosen={todayChoice.foodIds.includes(food.id)}
                  onChoose={handleToggleFood}
                  onToggleFavorite={handleToggleFavorite}
                  onRate={handleRate}
                  onShowRecipe={setRecipeFood}
                  onDeleteFood={handleDeleteFood}
                />
              ))}
              {favoriteFoods.length === 0 && (
                <p className="empty-state">עדיין אין מועדפים — סמן/י לב על מאכלים שאהבת ❤️</p>
              )}
            </div>

            <h2 className="section-title" style={{ marginTop: 28 }}>
              🕓 ההיסטוריה שלי
            </h2>
            <ul className="history-list">
              {kidHistory.length === 0 && <li className="empty-state">עדיין אין היסטוריה</li>}
              {kidHistory.map((entry, i) => {
                const food = allFoods.find((f) => f.id === entry.foodId)
                if (!food) return null
                return (
                  <li key={i} className="history-list__item">
                    <span>{food.emoji} {food.name}</span>
                    <span className="history-list__date">{entry.date}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} position="bottom" />
      {recipeFood && <RecipeModal food={recipeFood} onClose={() => setRecipeFood(null)} />}
    </div>
  )
}
