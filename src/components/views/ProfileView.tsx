import { Icon } from '../icons/Icon'
import type { UserProfile } from '../../api/auth'

interface ProfileViewProps {
  user: UserProfile | null
  loading: boolean
  onOpenSaved: () => void
  onLogin: () => void
  onLogout: () => void
}

function maskPhone(phone: string): string {
  if (phone.length < 8) return phone
  return `${phone.slice(0, 5)}•••${phone.slice(-3)}`
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function ProfileView({
  user,
  loading,
  onOpenSaved,
  onLogin,
  onLogout,
}: ProfileViewProps) {
  const menuItems = [
    { icon: 'ticket' as const, label: 'My listed tickets' },
    { icon: 'heart' as const, label: 'Saved events', action: onOpenSaved },
    { icon: 'bell' as const, label: 'Waitlist alerts' },
    { icon: 'shield' as const, label: 'Security & PIN' },
  ]

  if (loading) {
    return (
      <div className="card py-10 text-center">
        <p className="text-sm text-text-mid">Loading profile…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase text-text-lo sm:text-xs">ACCOUNT</p>
          <h1 className="h-title text-lg text-text-hi sm:text-xl lg:text-2xl">Your profile</h1>
        </div>
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-dim">
            <Icon name="user" size={20} className="text-violet" />
          </div>
          <p className="text-sm text-text-mid">Log in with your phone number to list tickets and track purchases.</p>
          <button type="button" onClick={onLogin} className="btn btn-emerald mt-1">
            Log in with phone
          </button>
        </div>
      </div>
    )
  }

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
          {initials(user.full_name || 'User')}
        </div>
        <div>
          <div className="h-title text-[15px] sm:text-base">{user.full_name || 'User'}</div>
          <div className="font-mono text-[10.5px] text-text-lo sm:text-xs">
            {maskPhone(user.phone_number)} · {user.is_verified ? 'Verified' : 'Unverified'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { value: '—', label: 'Bought' },
          { value: '—', label: 'Sold' },
          { value: user.rating?.toFixed(1) ?? '—', label: 'Rating' },
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
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 px-0.5 py-2.5 text-left text-[13px] text-danger transition-all active:scale-[0.99] sm:text-sm"
        >
          <Icon name="x" size={16} />
          Log out
        </button>
      </div>
    </div>
  )
}
