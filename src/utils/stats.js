export function computeStreak(entries) {
  if (!entries || entries.length === 0) return 0
  const dates = [...new Set(entries.map((e) => e.date))].sort().reverse()
  let streak = 0
  const cursor = new Date()
  for (const d of dates) {
    const cursorKey = cursor.toISOString().slice(0, 10)
    if (d === cursorKey) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function getWeeklyChallenge(foods, kidRatings) {
  const unrated = foods.filter((f) => !kidRatings[f.id])
  const pool = unrated.length > 0 ? unrated : foods
  if (pool.length === 0) return null
  const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000))
  return pool[week % pool.length]
}
