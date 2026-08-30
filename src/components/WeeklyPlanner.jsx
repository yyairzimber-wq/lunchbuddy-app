import { useState } from 'react'
import { DAYS } from '../data/foods'

export default function WeeklyPlanner({ foods, plan, onSetMeal, onClearMeal }) {
  const [pickingDay, setPickingDay] = useState(null)

  return (
    <div className="weekly-planner">
      {DAYS.map((day) => {
        const foodId = plan[day.id]
        const food = foodId ? foods.find((f) => f.id === foodId) : null
        return (
          <div key={day.id} className="planner-day">
            <div className="planner-day__row">
              <span className="planner-day__label">{day.name}</span>
              {food ? (
                <button className="planner-day__meal" onClick={() => setPickingDay(day.id)}>
                  {food.emoji} {food.name}
                </button>
              ) : (
                <button className="planner-day__empty" onClick={() => setPickingDay(day.id)}>
                  + הוסף
                </button>
              )}
              {food && (
                <button className="planner-day__clear" onClick={() => onClearMeal(day.id)}>
                  נקה
                </button>
              )}
            </div>

            {pickingDay === day.id && (
              <div className="planner-picker">
                {foods.map((f) => (
                  <button
                    key={f.id}
                    className="planner-picker__item"
                    onClick={() => {
                      onSetMeal(day.id, f.id)
                      setPickingDay(null)
                    }}
                  >
                    {f.emoji} {f.name}
                  </button>
                ))}
                <button className="btn btn--small" onClick={() => setPickingDay(null)}>
                  ביטול
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
