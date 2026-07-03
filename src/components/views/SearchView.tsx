import { Icon } from '../icons/Icon'

export function SearchView() {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[10.5px] uppercase text-text-lo sm:text-xs">DISCOVER</p>
        <h1 className="h-title text-lg text-text-hi sm:text-xl lg:text-2xl">Search</h1>
      </div>
      <div className="search-box">
        <Icon name="search" size={15} />
        <span className="text-xs sm:text-sm">Search events, artists, venues…</span>
      </div>
      <div className="card text-sm text-text-mid">
        Use the Home tab search bar for live filtering — this screen is reserved for advanced discovery.
      </div>
    </div>
  )
}
