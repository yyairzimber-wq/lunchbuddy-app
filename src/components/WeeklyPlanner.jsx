import { useState } from 'react'
import { DAYS } from '../data/foods'

export default function WeeklyPlanner({ foods, plan, onToggleMeal, onClearMeal }) {
  const [pickingDay, setPickingDay] = useState(null)

  return (
    <div className="weekly-planner">
      {DAYS.map((day) => {
        const entry = plan[day.id]
        const foodIds = Array.isArray(entry) ? entry : entry ? [entry] : []
        const dayFoods = foodIds.map((id) => foods.find((f) => f.id === id)).filter(Boolean)
        return (
          <div key={day.id} className="planner-day">
            <div className="planner-day__row">
              <span className="planner-day__label">{day.name}</span>
              <div className="planner-day__meals">
                {dayFoods.map((food) => (
                  <span key={food.id} className="planner-day__meal">
                    {food.emoji} {food.name}
                    <button
                      className="planner-day__meal-remove"
                      onClick={() => onToggleMeal(day.id, food.id)}
                      aria-label={`הסר ${food.name}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <button className="planner-day__empty" onClick={() => setPickingDay(day.id)}>
                  + הוסף
                </button>
              </div>
              {dayFoods.length > 0 && (
                <button className="planner-day__clear" onClick={() => onClearMeal(day.id)}>
                  נקה הכל
                </button>
              )}
            </div>

            {pickingDay === day.id && (
              <div className="planner-picker">
                {foods.map((f) => {
                  const selected = foodIds.includes(f.id)
                  return (
                    <button
                      key={f.id}
                      className={`planner-picker__item${selected ? ' planner-picker__item--selected' : ''}`}
                      onClick={() => onToggleMeal(day.id, f.id)}
                    >
                      {f.emoji} {f.name} {selected && '✓'}
                    </button>
                  )
                })}
                <button className="btn btn--small btn--wide" onClick={() => setPickingDay(null)}>
                  סיום
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
