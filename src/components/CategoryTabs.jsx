import { CATEGORIES } from '../data/foods'

export default function CategoryTabs({ active, onChange }) {
  return (
    <div className="category-tabs">
      <button
        className={`category-tab${active === 'all' ? ' category-tab--active' : ''}`}
        onClick={() => onChange('all')}
      >
        🍽️ הכל
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          className={`category-tab${active === cat.id ? ' category-tab--active' : ''}`}
          onClick={() => onChange(cat.id)}
        >
          {cat.emoji} {cat.name}
        </button>
      ))}
    </div>
  )
}
