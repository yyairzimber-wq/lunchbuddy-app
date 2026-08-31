import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { arrayRemove, arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
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
  customFoods: [],
  todayMenu: null,
}

const EMPTY_TODAY = { foodIds: [], skip: false }

const LOCAL_FAMILY_KEY = 'lb.family'

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
  const [familyId, setFamilyId] = useLocalStorage('lb.familyId', null)

  // Each family gets its own Firestore document, keyed by a 6-digit code the
  // parent shares with the kids' devices — otherwise every visitor to the
  // deployed site would read/write the same shared data.
  const familyRef = useMemo(
    () => (firebaseReady && familyId ? doc(db, 'families', familyId) : null),
    [familyId]
  )

  // Before per-family docs existed, every device shared one hardcoded
  // document ("families/main"). Offer to carry that data forward into a
  // proper family code instead of silently orphaning it.
  const [legacyFamily, setLegacyFamily] = useState(null)

  useEffect(() => {
    // Only offer this to a device that already picked a role under the old
    // shared-doc model — a genuinely new visitor has no deviceRole yet and
    // has nothing to migrate, so it must never see someone else's family.
    if (!firebaseReady || familyId || !deviceRole) return
    let cancelled = false
    getDoc(doc(db, 'families', 'main'))
      .then((snap) => {
        if (cancelled) return
        if (snap.exists() && (snap.data().kids || []).length > 0) {
          setLegacyFamily(snap.data())
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [familyId, deviceRole])

  const migrateLegacyFamily = useCallback(async () => {
    if (!legacyFamily) return { ok: false }
    const code = generateCode()
    await setDoc(doc(db, 'families', code), legacyFamily)
    setFamilyId(code)
    return { ok: true, code }
  }, [legacyFamily, setFamilyId])

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
    if (!familyRef) return
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
  }, [familyRef])

  const applyUpdate = useCallback((partial) => {
    if (firebaseReady && familyRef) {
      updateDoc(familyRef, partial).catch(() => setDoc(familyRef, partial, { merge: true }))
    } else {
      setFamily((prev) => {
        const next = { ...prev, ...partial }
        window.localStorage.setItem(LOCAL_FAMILY_KEY, JSON.stringify(next))
        return next
      })
    }
  }, [familyRef])

  const createFamily = useCallback(() => {
    const code = generateCode()
    setFamilyId(code)
    return code
  }, [setFamilyId])

  const joinFamily = useCallback(async (code) => {
    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) return { ok: false, reason: 'invalid' }
    const snap = await getDoc(doc(db, 'families', trimmed))
    if (!snap.exists()) return { ok: false, reason: 'not_found' }
    setFamilyId(trimmed)
    return { ok: true }
  }, [setFamilyId])

  const chooseRole = (role) => setDeviceRole(role)

  const resetDevice = () => {
    setDeviceRole(null)
    setMyKidId(null)
  }

  // A kid's device only reaches this point after entering the family code, so
  // that code IS the confirmation — no separate per-kid pairing code needed.
  const createChildProfile = (name, avatar) => {
    const id = `kid_${Date.now()}`
    applyUpdate({ kids: [...family.kids, { id, name, avatar }] })
    setDeviceRole('child')
    setMyKidId(id)
    return id
  }

  const addKidDirect = (name, avatar) => {
    const id = `kid_${Date.now()}`
    applyUpdate({ kids: [...family.kids, { id, name, avatar }] })
    return id
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
    const isFreshDay = !entry || entry.date !== date
    const has = !isFreshDay && entry.foodIds.includes(foodId)

    if (firebaseReady) {
      // Use atomic array ops keyed by field path instead of read-modify-write on the
      // whole todayChoices map, so picking several meals in quick succession can't
      // have one tap's write clobber another's before its round-trip finishes.
      if (isFreshDay) {
        const fresh = { [`todayChoices.${kidId}`]: { date, foodIds: [foodId], skip: false } }
        updateDoc(familyRef, fresh).catch(() => setDoc(familyRef, fresh, { merge: true }))
      } else {
        const fieldUpdates = {
          [`todayChoices.${kidId}.foodIds`]: has ? arrayRemove(foodId) : arrayUnion(foodId),
        }
        if (!has) fieldUpdates[`todayChoices.${kidId}.skip`] = false
        updateDoc(familyRef, fieldUpdates).catch(() => {})
      }
    } else {
      const current = isFreshDay ? [] : entry.foodIds
      const nextFoodIds = has ? current.filter((id) => id !== foodId) : [...current, foodId]
      applyUpdate({ todayChoices: { ...family.todayChoices, [kidId]: { date, foodIds: nextFoodIds, skip: false } } })
    }

    if (!has) {
      const currentHistory = family.history[kidId] || []
      applyUpdate({ history: { ...family.history, [kidId]: [{ date, foodId }, ...currentHistory].slice(0, 50) } })
    }
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

  const setTodayMenu = (text) => {
    applyUpdate({ todayMenu: { date: todayKey(), text: text.trim() } })
  }

  const todayMenuText = family.todayMenu && family.todayMenu.date === todayKey() ? family.todayMenu.text : ''

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
      customFoods: family.customFoods,
      todayMenuText,
      allFoods,
      ready,
      syncMode: firebaseReady ? 'cloud' : 'local',
      familyId,
      createFamily,
      joinFamily,
      legacyFamily,
      migrateLegacyFamily,
      deviceRole,
      myKidId,
      chooseRole,
      resetDevice,
      createChildProfile,
      addKidDirect,
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
      setTodayMenu,
      addCustomFood,
      removeCustomFood,
      setKidPhoto,
    }),
    [
      family,
      ready,
      deviceRole,
      myKidId,
      allFoods,
      familyId,
      createFamily,
      joinFamily,
      legacyFamily,
      migrateLegacyFamily,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
