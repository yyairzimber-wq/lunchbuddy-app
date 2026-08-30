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
  poll: null,
  weeklyPlan: {},
  pantry: [],
  customFoods: [],
}

const EMPTY_TODAY = { foodIds: [], skip: false }

const LOCAL_FAMILY_KEY = 'lb.family'
const familyRef = firebaseReady ? doc(db, 'families', 'main') : null

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
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

  const toggleTodayFood = (kidId, foodId) => {
    const date = todayKey()
    const entry = family.todayChoices[kidId]
    const current = entry && entry.date === date ? entry.foodIds : []
    const has = current.includes(foodId)
    const nextFoodIds = has ? current.filter((id) => id !== foodId) : [...current, foodId]
    const nextTodayChoices = {
      ...family.todayChoices,
      [kidId]: { date, foodIds: nextFoodIds, skip: false },
    }
    if (has) {
      applyUpdate({ todayChoices: nextTodayChoices })
      return
    }
    const currentHistory = family.history[kidId] || []
    const nextHistory = { ...family.history, [kidId]: [{ date, foodId }, ...currentHistory].slice(0, 50) }
    applyUpdate({ todayChoices: nextTodayChoices, history: nextHistory })
  }

  const skipToday = (kidId) => {
    const date = todayKey()
    applyUpdate({ todayChoices: { ...family.todayChoices, [kidId]: { date, foodIds: [], skip: true } } })
  }

  const getTodayChoices = (kidId) => {
    const entry = family.todayChoices[kidId]
    if (!entry || entry.date !== todayKey()) return EMPTY_TODAY
    if (Array.isArray(entry.foodIds)) return entry
    // legacy shape from before multi-select support: { date, foodId, source }
    if (entry.foodId && entry.foodId !== 'skip') {
      return { date: entry.date, foodIds: [entry.foodId], skip: false }
    }
    return { date: entry.date, foodIds: [], skip: entry.foodId === 'skip' }
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

  const startPoll = (question, options) => {
    applyUpdate({
      poll: { id: `poll_${Date.now()}`, question, options, votes: {}, closed: false, result: null },
    })
  }

  const castPollVote = (kidId, optionIndex) => {
    if (!family.poll || family.poll.closed) return
    applyUpdate({ poll: { ...family.poll, votes: { ...family.poll.votes, [kidId]: optionIndex } } })
  }

  const closePoll = () => {
    if (!family.poll) return
    const { options, votes } = family.poll
    const tally = new Array(options.length).fill(0)
    Object.values(votes).forEach((idx) => {
      tally[idx] = (tally[idx] || 0) + 1
    })
    let winner = 0
    let best = -1
    tally.forEach((count, idx) => {
      if (count > best) {
        best = count
        winner = idx
      }
    })
    applyUpdate({ poll: { ...family.poll, closed: true, result: winner } })
  }

  const clearPoll = () => applyUpdate({ poll: null })

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
      poll: family.poll,
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
      toggleTodayFood,
      skipToday,
      getTodayChoices,
      addShoppingItem,
      toggleShoppingItem,
      removeShoppingItem,
      startPoll,
      castPollVote,
      closePoll,
      clearPoll,
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
