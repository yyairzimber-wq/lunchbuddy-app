export default function FoodCard({ food, isFavorite, rating, isChosen, onChoose, onToggleFavorite, onRate, onShowRecipe, onDeleteFood }) {
  return (
    <div className={`food-card${isChosen ? ' food-card--chosen' : ''}`}>
      <button
        className="food-card__fav"
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(food.id)
        }}
        aria-label="מועדף"
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>
      {onShowRecipe && food.recipe && (
        <button
          className="food-card__recipe"
          onClick={(e) => {
            e.stopPropagation()
            onShowRecipe(food)
          }}
          aria-label="מתכון"
        >
          📖
        </button>
      )}
      {onDeleteFood && food.custom && (
        <button
          className="food-card__recipe"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteFood(food)
          }}
          aria-label="מחק מאכל"
        >
          🗑️
        </button>
      )}
      <button className="food-card__body" onClick={() => onChoose(food.id)}>
        <span className="food-card__emoji">{food.emoji}</span>
        <span className="food-card__name">{food.name}</span>
      </button>
      <div className="food-card__stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className="food-card__star"
            onClick={(e) => {
              e.stopPropagation()
              onRate(food.id, n)
            }}
            aria-label={`דרג ${n} כוכבים`}
          >
            {rating >= n ? '⭐' : '☆'}
          </button>
        ))}
      </div>
      {isChosen && <div className="food-card__badge">הבחירה של היום ✓</div>}
    </div>
  )
}
