import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Utensils, Heart, History, User, Moon, Sun, CalendarDays } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import CategoryTabs from '../components/CategoryTabs'
import FoodCard from '../components/FoodCard'
import TabBar from '../components/TabBar'
import VoteCard from '../components/VoteCard'
import RecipeModal from '../components/RecipeModal'
import WeeklyPlanner from '../components/WeeklyPlanner'
import AddFoodForm from '../components/AddFoodForm'
import PhotoPicker from '../components/PhotoPicker'
import { computeStreak, getWeeklyChallenge } from '../utils/stats'
import { getMakeableFoods } from '../utils/pantry'

const TABS = [
  { id: 'choose', label: 'בחירה', icon: <Utensils size={18} /> },
  { id: 'planner', label: 'תכנון שבועי', icon: <CalendarDays size={18} /> },
  { id: 'favorites', label: 'מועדפים', icon: <Heart size={18} /> },
  { id: 'history', label: 'היסטוריה', icon: <History size={18} /> },
  { id: 'profile', label: 'הפרופיל שלי', icon: <User size={18} /> },
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
    chooseFood,
    skipToday,
    getTodayChoice,
    history,
    resetDevice,
    activeVote,
    castVote,
    weeklyPlan,
    pantry,
    setWeeklyMeal,
    clearWeeklyMeal,
    allFoods,
    addCustomFood,
    removeCustomFood,
    setKidPhoto,
  } = useApp()

  const kid = kids.find((k) => k.id === kidId)
  const [tab, setTab] = useState('choose')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [suggestion, setSuggestion] = useState(null)
  const [recipeFood, setRecipeFood] = useState(null)
  const [addingFood, setAddingFood] = useState(false)

  const kidFavorites = favorites[kidId] || []
  const kidRatings = ratings[kidId] || {}
  const kidHistory = history[kidId] || []
  const todayChoice = getTodayChoice(kidId)
  const chosenFood =
    todayChoice && todayChoice.foodId !== 'skip' ? allFoods.find((f) => f.id === todayChoice.foodId) : null
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

  const handleChoose = (id) => {
    chooseFood(kidId, id)
    showToast('האוכל של היום נבחר!', '🎉')
  }

  const handleSkip = () => {
    skipToday(kidId)
    showToast('סימנת שאתה לא רוצה לבחור היום', '🙅')
  }

  const handleVote = (foodId) => {
    castVote(kidId, foodId)
    showToast('ההצבעה שלך נשמרה', '🗳️')
  }

  const pickForMe = () => {
    const pool = filteredFoods.length > 0 ? filteredFoods : allFoods
    const pick = pool[Math.floor(Math.random() * pool.length)]
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
              {chosenFood && (
                <div className="today-banner">
                  היום בחרת: <strong>{chosenFood.emoji} {chosenFood.name}</strong> 🎉
                </div>
              )}
              {todayChoice?.foodId === 'skip' && (
                <div className="today-banner today-banner--skip">סימנת שאתה לא רוצה לבחור היום 🙅</div>
              )}
            </div>

            {activeVote && !chosenFood && (
              <VoteCard vote={activeVote} kidId={kidId} foods={allFoods} onVote={handleVote} />
            )}

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
                        handleChoose(suggestion.id)
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
                  isChosen={chosenFood?.id === food.id}
                  onChoose={handleChoose}
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

        {tab === 'favorites' && (
          <div className="tab-fade">
            <h1 className="section-title">❤️ המועדפים שלי</h1>
            <div className="food-grid">
              {favoriteFoods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  isFavorite
                  rating={kidRatings[food.id] || 0}
                  isChosen={chosenFood?.id === food.id}
                  onChoose={handleChoose}
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
          </div>
        )}

        {tab === 'history' && (
          <div className="tab-fade">
            <h1 className="section-title">🕓 ההיסטוריה שלי</h1>
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
          </div>
        )}
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} position="bottom" />
      {recipeFood && <RecipeModal food={recipeFood} onClose={() => setRecipeFood(null)} />}
    </div>
  )
}
