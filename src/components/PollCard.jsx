export default function PollCard({ poll, kidId, onVote }) {
  const myVote = poll.votes[kidId]

  return (
    <div className="vote-card">
      <div className="vote-card__title">{poll.closed ? '🏆 התוצאה' : '📊 סקר מההורים'}</div>
      <div className="vote-card__question">{poll.question}</div>
      <div className="vote-card__options">
        {poll.options.map((opt, i) => (
          <button
            key={i}
            className={`vote-option${myVote === i ? ' vote-option--selected' : ''}${
              poll.closed && poll.result === i ? ' vote-option--winner' : ''
            }`}
            disabled={poll.closed}
            onClick={() => onVote(i)}
          >
            <span>{opt}</span>
            {myVote === i && !poll.closed && <span className="vote-option__check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
