import { useState } from 'react'
import { CATEGORIES } from '../data/foods'

const EMOJIS = ['🍽️', '🍕', '🍔', '🌮', '🥙', '🍜', '🍱', '🥘', '🍛', '🥟', '🍤', '🧇', '🍩', '🥐']

export default function AddFoodForm({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [category, setCategory] = useState(CATEGORIES[1].id)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name, emoji, category)
    setName('')
    onClose()
  }

  return (
    <form className="add-food-form" onSubmit={handleSubmit}>
      <input
        className="text-input"
        placeholder="שם המאכל..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="avatar-picker">
        {EMOJIS.map((e) => (
          <button
            type="button"
            key={e}
            className={`avatar-option${emoji === e ? ' avatar-option--active' : ''}`}
            onClick={() => setEmoji(e)}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="category-tabs category-tabs--static">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`category-tab${category === c.id ? ' category-tab--active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <div className="add-kid-form__actions">
        <button type="submit" className="btn btn--primary">
          הוסף מאכל
        </button>
        <button type="button" className="btn" onClick={onClose}>
          ביטול
        </button>
      </div>
    </form>
  )
}
