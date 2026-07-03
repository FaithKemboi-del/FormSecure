import { Icon } from '../icons/Icon'
import type { NavTab } from '../../types/event'

const tabs: { id: NavTab; label: string; icon: 'home' | 'search' | 'heart' | 'wallet' | 'user' }[] =
  [
    { id: 'home', label: 'HOME', icon: 'home' },
    { id: 'search', label: 'SEARCH', icon: 'search' },
    { id: 'saved', label: 'SAVED', icon: 'heart' },
    { id: 'wallet', label: 'WALLET', icon: 'wallet' },
    { id: 'profile', label: 'PROFILE', icon: 'user' },
  ]

interface BottomNavProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  savedCount?: number
}

export function BottomNav({ activeTab, onTabChange, savedCount = 0 }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-bg/60 backdrop-blur-md lg:left-1/2 lg:max-w-5xl lg:-translate-x-1/2 lg:rounded-t-2xl lg:border-x">
      <div className="mx-auto flex max-w-5xl items-center justify-around px-1.5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-2 py-1 transition-all active:scale-95 ${
                isActive ? 'text-emerald' : 'text-text-lo'
              }`}
            >
              <Icon name={tab.icon} size={18} />
              <span className="font-mono text-[9px] tracking-wide">{tab.label}</span>
              {tab.id === 'saved' && savedCount > 0 ? (
                <span className="absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald px-1 text-[9px] font-bold text-[#022018]">
                  {savedCount}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
