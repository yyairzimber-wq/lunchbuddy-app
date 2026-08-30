import { INGREDIENTS } from '../data/foods'

export default function RecipeModal({ food, onClose }) {
  if (!food) return null
  const ingredients = food.ingredients.map((id) => INGREDIENTS.find((i) => i.id === id)).filter(Boolean)

  return (
    <div className="suggestion-modal" onClick={onClose}>
      <div className="suggestion-modal__card recipe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="recipe-modal__header">
          <span className="recipe-modal__emoji">{food.emoji}</span>
          <div>
            <div className="recipe-modal__title">{food.name}</div>
            <div className="recipe-modal__time">⏱️ {food.recipe.time}</div>
          </div>
        </div>
        <div className="recipe-modal__section">
          <h3>מצרכים</h3>
          <div className="recipe-modal__ingredients">
            {ingredients.map((ing) => (
              <span key={ing.id} className="recipe-modal__ingredient">
                {ing.emoji} {ing.name}
              </span>
            ))}
          </div>
        </div>
        <div className="recipe-modal__section">
          <h3>הכנה</h3>
          <p>{food.recipe.steps}</p>
        </div>
        <button className="btn btn--primary btn--wide" onClick={onClose}>
          סגור
        </button>
      </div>
    </div>
  )
}
