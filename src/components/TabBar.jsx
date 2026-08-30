export default function TabBar({ tabs, active, onChange, position = 'bottom' }) {
  return (
    <nav className={`tabbar tabbar--${position}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tabbar__item${active === tab.id ? ' tabbar__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tabbar__icon">{tab.icon}</span>
          <span className="tabbar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
