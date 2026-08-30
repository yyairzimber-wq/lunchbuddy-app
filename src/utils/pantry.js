export function getMakeableFoods(foods, pantry) {
  if (pantry.length === 0) return []
  return foods.filter(
    (food) => food.ingredients.length > 0 && food.ingredients.every((ing) => pantry.includes(ing))
  )
}
