import { Icon } from '../icons/Icon'

interface ProfileViewProps {
  onOpenSaved: () => void
}

export function ProfileView({ onOpenSaved }: ProfileViewProps) {
  const menuItems = [
    { icon: 'ticket' as const, label: 'My listed tickets' },
    { icon: 'heart' as const, label: 'Saved events', action: onOpenSaved },
    { icon: 'bell' as const, label: 'Waitlist alerts' },
    { icon: 'shield' as const, label: 'Security & PIN' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full text-base font-bold text-bg"
          style={{
            background: 'linear-gradient(135deg, var(--color-violet), var(--color-emerald))',
            fontFamily: 'var(--font-display)',
          }}
        >
          MW
        </div>
        <div>
          <div className="h-title text-[15px] sm:text-base">Mwangi W.</div>
          <div className="font-mono text-[10.5px] text-text-lo sm:text-xs">07XX ••• 234 · Verified</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { value: '6', label: 'Bought' },
          { value: '3', label: 'Sold' },
          { value: '4.9', label: 'Rating' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className="font-display text-base font-bold sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
              {stat.value}
            </div>
            <div className="font-mono text-[9.5px] text-text-lo sm:text-[10px]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="h-px bg-white/8" />

      <div className="space-y-0.5">
        {menuItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="flex w-full items-center justify-between px-0.5 py-2.5 text-left text-[13px] transition-all active:scale-[0.99] sm:text-sm"
          >
            <span className="flex items-center gap-2.5">
              <Icon name={item.icon} size={16} className="text-text-mid" />
              {item.label}
            </span>
            <Icon name="chevron" size={14} className="text-text-lo" />
          </button>
        ))}
        <button
          type="button"
          className="flex w-full items-center gap-2.5 px-0.5 py-2.5 text-left text-[13px] text-danger transition-all active:scale-[0.99] sm:text-sm"
        >
          <Icon name="x" size={16} />
          Log out
        </button>
      </div>
    </div>
  )
}
