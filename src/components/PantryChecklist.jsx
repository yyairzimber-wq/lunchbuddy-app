import { INGREDIENTS } from '../data/foods'

export default function PantryChecklist({ pantry, onToggle }) {
  return (
    <div className="pantry-grid">
      {INGREDIENTS.map((ing) => {
        const active = pantry.includes(ing.id)
        return (
          <button
            key={ing.id}
            className={`pantry-item${active ? ' pantry-item--active' : ''}`}
            onClick={() => onToggle(ing.id)}
          >
            <span>{ing.emoji}</span>
            <span>{ing.name}</span>
            {active && <span className="pantry-item__check">✓</span>}
          </button>
        )
      })}
    </div>
  )
}
