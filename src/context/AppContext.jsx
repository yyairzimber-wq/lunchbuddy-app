import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db, firebaseReady } from '../firebase'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { FOODS } from '../data/foods'

const AppContext = createContext(null)

const DEFAULT_FAMILY = {
  kids: [],
  favorites: {},
  ratings: {},
  todayChoices: {},
  history: {},
  shoppingList: [],
  activeVote: null,
  weeklyPlan: {},
  pantry: [],
  customFoods: [],
}

const LOCAL_FAMILY_KEY = 'lb.family'
const familyRef = firebaseReady ? doc(db, 'families', 'main') : null

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function withChoice(todayChoices, history, kidId, foodId, source) {
  const date = todayKey()
  const nextTodayChoices = { ...todayChoices, [kidId]: { date, foodId, source } }
  const currentHistory = history[kidId] || []
  const nextHistory =
    foodId === 'skip'
      ? history
      : { ...history, [kidId]: [{ date, foodId }, ...currentHistory].slice(0, 50) }
  return { todayChoices: nextTodayChoices, history: nextHistory }
}

export function AppProvider({ children }) {
  const [family, setFamily] = useState(DEFAULT_FAMILY)
  const [ready, setReady] = useState(!firebaseReady)
  const [deviceRole, setDeviceRole] = useLocalStorage('lb.deviceRole', null)
  const [myKidId, setMyKidId] = useLocalStorage('lb.myKidId', null)

  useEffect(() => {
    if (!firebaseReady) {
      try {
        const stored = window.localStorage.getItem(LOCAL_FAMILY_KEY)
        if (stored) {
          setFamily({ ...DEFAULT_FAMILY, ...JSON.parse(stored) })
        } else {
          const legacyKids = window.localStorage.getItem('lb.kids')
          if (legacyKids) {
            setFamily({
              kids: JSON.parse(legacyKids),
              favorites: JSON.parse(window.localStorage.getItem('lb.favorites') || '{}'),
              ratings: JSON.parse(window.localStorage.getItem('lb.ratings') || '{}'),
              todayChoices: JSON.parse(window.localStorage.getItem('lb.todayChoices') || '{}'),
              history: JSON.parse(window.localStorage.getItem('lb.history') || '{}'),
              shoppingList: JSON.parse(window.localStorage.getItem('lb.shoppingList') || '[]'),
              activeVote: JSON.parse(window.localStorage.getItem('lb.activeVote') || 'null'),
            })
          }
        }
      } catch {
        // ignore
      }
      setReady(true)
      return
    }
    const unsub = onSnapshot(
      familyRef,
      (snap) => {
        if (snap.exists()) {
          setFamily({ ...DEFAULT_FAMILY, ...snap.data() })
        } else {
          setDoc(familyRef, DEFAULT_FAMILY)
          setFamily(DEFAULT_FAMILY)
        }
        setReady(true)
      },
      () => setReady(true)
    )
    return unsub
  }, [])

  const applyUpdate = useCallback((partial) => {
    if (firebaseReady) {
      updateDoc(familyRef, partial).catch(() => setDoc(familyRef, partial, { merge: true }))
    } else {
      setFamily((prev) => {
        const next = { ...prev, ...partial }
        window.localStorage.setItem(LOCAL_FAMILY_KEY, JSON.stringify(next))
        return next
      })
    }
  }, [])

  const chooseRole = (role) => setDeviceRole(role)

  const resetDevice = () => {
    setDeviceRole(null)
    setMyKidId(null)
  }

  const createChildProfile = (name, avatar) => {
    const id = `kid_${Date.now()}`
    const code = generateCode()
    applyUpdate({ kids: [...family.kids, { id, name, avatar, paired: false, code }] })
    setDeviceRole('child')
    setMyKidId(id)
    return id
  }

  const addKidDirect = (name, avatar) => {
    const id = `kid_${Date.now()}`
    applyUpdate({ kids: [...family.kids, { id, name, avatar, paired: true, code: null }] })
    return id
  }

  const addKidByCode = (code) => {
    const trimmed = code.trim()
    const match = family.kids.find((k) => !k.paired && k.code === trimmed)
    if (!match) return null
    applyUpdate({
      kids: family.kids.map((k) => (k.id === match.id ? { ...k, paired: true, code: null } : k)),
    })
    return match
  }

  const removeKid = (kidId) => {
    applyUpdate({ kids: family.kids.filter((k) => k.id !== kidId) })
  }

  const toggleFavorite = (kidId, foodId) => {
    const current = family.favorites[kidId] || []
    const next = current.includes(foodId)
      ? current.filter((id) => id !== foodId)
      : [...current, foodId]
    applyUpdate({ favorites: { ...family.favorites, [kidId]: next } })
  }

  const rateFood = (kidId, foodId, rating) => {
    applyUpdate({
      ratings: { ...family.ratings, [kidId]: { ...(family.ratings[kidId] || {}), [foodId]: rating } },
    })
  }

  const chooseFood = (kidId, foodId, source = 'kid') => {
    applyUpdate(withChoice(family.todayChoices, family.history, kidId, foodId, source))
  }

  const skipToday = (kidId) => {
    applyUpdate(withChoice(family.todayChoices, family.history, kidId, 'skip', 'kid'))
  }

  const getTodayChoice = (kidId) => {
    const entry = family.todayChoices[kidId]
    if (!entry || entry.date !== todayKey()) return null
    return entry
  }

  const addShoppingItem = (text) => {
    if (!text.trim()) return
    applyUpdate({
      shoppingList: [...family.shoppingList, { id: `item_${Date.now()}`, text: text.trim(), done: false }],
    })
  }

  const toggleShoppingItem = (id) => {
    applyUpdate({
      shoppingList: family.shoppingList.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    })
  }

  const removeShoppingItem = (id) => {
    applyUpdate({ shoppingList: family.shoppingList.filter((item) => item.id !== id) })
  }

  const startVote = (foodIds) => {
    applyUpdate({ activeVote: { id: `vote_${Date.now()}`, foodIds, votes: {}, closed: false, result: null } })
  }

  const castVote = (kidId, foodId) => {
    if (!family.activeVote || family.activeVote.closed) return
    applyUpdate({ activeVote: { ...family.activeVote, votes: { ...family.activeVote.votes, [kidId]: foodId } } })
  }

  const closeVote = () => {
    if (!family.activeVote) return
    const { foodIds, votes } = family.activeVote
    const tally = {}
    Object.values(votes).forEach((foodId) => {
      tally[foodId] = (tally[foodId] || 0) + 1
    })
    let winner = foodIds[0]
    let best = -1
    foodIds.forEach((foodId) => {
      const count = tally[foodId] || 0
      if (count > best) {
        best = count
        winner = foodId
      }
    })
    applyUpdate({ activeVote: { ...family.activeVote, closed: true, result: winner } })
  }

  const applyVoteResult = () => {
    if (!family.activeVote || !family.activeVote.result) return
    const winner = family.activeVote.result
    let todayChoices = family.todayChoices
    let history = family.history
    family.kids
      .filter((k) => k.paired)
      .forEach((k) => {
        const next = withChoice(todayChoices, history, k.id, winner, 'vote')
        todayChoices = next.todayChoices
        history = next.history
      })
    applyUpdate({ todayChoices, history, activeVote: null })
  }

  const clearVote = () => applyUpdate({ activeVote: null })

  const allFoods = useMemo(() => [...FOODS, ...family.customFoods], [family.customFoods])

  const setWeeklyMeal = (kidId, day, foodId) => {
    applyUpdate({
      weeklyPlan: {
        ...family.weeklyPlan,
        [kidId]: { ...(family.weeklyPlan[kidId] || {}), [day]: foodId },
      },
    })
  }

  const clearWeeklyMeal = (kidId, day) => {
    const kidPlan = { ...(family.weeklyPlan[kidId] || {}) }
    delete kidPlan[day]
    applyUpdate({ weeklyPlan: { ...family.weeklyPlan, [kidId]: kidPlan } })
  }

  const togglePantryItem = (ingredientId) => {
    const next = family.pantry.includes(ingredientId)
      ? family.pantry.filter((id) => id !== ingredientId)
      : [...family.pantry, ingredientId]
    applyUpdate({ pantry: next })
  }

  const addCustomFood = (name, emoji, category) => {
    if (!name.trim()) return
    const newFood = {
      id: `c_${Date.now()}`,
      name: name.trim(),
      emoji: emoji || '🍽️',
      category: category || 'lunch',
      ingredients: [],
      recipe: null,
      custom: true,
    }
    applyUpdate({ customFoods: [...family.customFoods, newFood] })
    return newFood
  }

  const removeCustomFood = (foodId) => {
    applyUpdate({ customFoods: family.customFoods.filter((f) => f.id !== foodId) })
  }

  const setKidPhoto = (kidId, photoUrl) => {
    applyUpdate({ kids: family.kids.map((k) => (k.id === kidId ? { ...k, photoUrl } : k)) })
  }

  const value = useMemo(
    () => ({
      kids: family.kids,
      favorites: family.favorites,
      ratings: family.ratings,
      todayChoices: family.todayChoices,
      history: family.history,
      shoppingList: family.shoppingList,
      activeVote: family.activeVote,
      weeklyPlan: family.weeklyPlan,
      pantry: family.pantry,
      customFoods: family.customFoods,
      allFoods,
      ready,
      syncMode: firebaseReady ? 'cloud' : 'local',
      deviceRole,
      myKidId,
      chooseRole,
      resetDevice,
      createChildProfile,
      addKidDirect,
      addKidByCode,
      removeKid,
      toggleFavorite,
      rateFood,
      chooseFood,
      skipToday,
      getTodayChoice,
      addShoppingItem,
      toggleShoppingItem,
      removeShoppingItem,
      startVote,
      castVote,
      closeVote,
      applyVoteResult,
      clearVote,
      setWeeklyMeal,
      clearWeeklyMeal,
      togglePantryItem,
      addCustomFood,
      removeCustomFood,
      setKidPhoto,
    }),
    [family, ready, deviceRole, myKidId, allFoods]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
