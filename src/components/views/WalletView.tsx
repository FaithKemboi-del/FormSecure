import { Icon } from '../icons/Icon'

export function WalletView() {
  return (
    <div className="space-y-4">
      <h1 className="h-title text-base text-text-hi sm:text-lg">Wallet</h1>

      <div
        className="card border-white/8 p-4"
        style={{
          background:
            'linear-gradient(135deg, rgb(155 123 255 / 0.18), rgb(22 242 178 / 0.10))',
        }}
      >
        <p className="font-mono text-[10.5px] text-text-lo sm:text-xs">Available to withdraw</p>
        <div
          className="my-1 text-[26px] font-bold text-text-hi sm:text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          KSh 4,900
        </div>
        <button type="button" className="btn btn-emerald mt-2.5 w-full py-2 text-xs sm:text-sm">
          Withdraw to M-Pesa
        </button>
      </div>

      <p className="font-mono text-[10.5px] uppercase text-text-lo sm:text-xs">Recent activity</p>

      <div className="space-y-2.5">
        <div className="card flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-emerald-dim">
              <Icon name="check-circle" size={15} className="text-emerald" />
            </div>
            <div>
              <div className="text-xs font-semibold sm:text-sm">Sold · Watendawili Live</div>
              <div className="font-mono text-[10px] text-text-lo">Today, 3:41PM</div>
            </div>
          </div>
          <span className="pill pill-emerald">+KSh 2,500</span>
        </div>

        <div className="card flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-amber/15">
              <Icon name="clock" size={15} className="text-amber" />
            </div>
            <div>
              <div className="text-xs font-semibold sm:text-sm">Bought · Blankets &amp; Wine</div>
              <div className="font-mono text-[10px] text-text-lo">Held in escrow · 18:22 left</div>
            </div>
          </div>
          <span className="pill pill-amber">Pending</span>
        </div>
      </div>
    </div>
  )
}
