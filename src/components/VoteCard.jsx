export default function VoteCard({ vote, kidId, foods, onVote }) {
  const options = vote.foodIds.map((id) => foods.find((f) => f.id === id)).filter(Boolean)
  const myVote = vote.votes[kidId]

  return (
    <div className="vote-card">
      <div className="vote-card__title">
        {vote.closed ? '🏆 תוצאת ההצבעה המשפחתית' : '🗳️ ההורים פתחו הצבעה — מה נאכל?'}
      </div>
      <div className="vote-card__options">
        {options.map((food) => (
          <button
            key={food.id}
            className={`vote-option${myVote === food.id ? ' vote-option--selected' : ''}${
              vote.closed && vote.result === food.id ? ' vote-option--winner' : ''
            }`}
            disabled={vote.closed}
            onClick={() => onVote(food.id)}
          >
            <span className="vote-option__emoji">{food.emoji}</span>
            <span>{food.name}</span>
            {myVote === food.id && !vote.closed && <span className="vote-option__check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
