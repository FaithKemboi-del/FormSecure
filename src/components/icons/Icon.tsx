import type { ReactElement, SVGProps } from 'react'

export type IconName =
  | 'search'
  | 'filter'
  | 'heart'
  | 'heart-filled'
  | 'ticket'
  | 'wallet'
  | 'user'
  | 'home'
  | 'shield'
  | 'clock'
  | 'chat'
  | 'chevron'
  | 'check-circle'
  | 'x'
  | 'calendar'
  | 'pin'
  | 'share'
  | 'bell'
  | 'arrow-left'
  | 'sliders'

const paths: Record<IconName, ReactElement> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.6" y2="16.6" />
    </>
  ),
  filter: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  heart: (
    <path d="M12 21s-6.7-4.3-9.4-8.2C.9 10.1 1.5 6 5 4.5 7.5 3.4 9.8 4.5 12 7c2.2-2.5 4.5-3.6 7-2.5 3.5 1.5 4.1 5.6 2.4 8.2C18.7 16.7 12 21 12 21z" />
  ),
  'heart-filled': (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 21s-6.7-4.3-9.4-8.2C.9 10.1 1.5 6 5 4.5 7.5 3.4 9.8 4.5 12 7c2.2-2.5 4.5-3.6 7-2.5 3.5 1.5 4.1 5.6 2.4 8.2C18.7 16.7 12 21 12 21z"
    />
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
      <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 2" />
    </>
  ),
  wallet: (
    <>
      <rect x="2.5" y="6" width="19" height="14" rx="3" />
      <path d="M2.5 10h19" />
      <circle cx="17" cy="15" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.5-4 4.3-6 7.5-6s6 2 7.5 6" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  chat: <path d="M4 12a8 8 0 1 1 3.3 6.4L4 20l1.3-3.6A7.9 7.9 0 0 1 4 12z" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3l2.3 2.3 4.7-5" />
    </>
  ),
  x: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v3.5M16 3.5v3.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="18" cy="6" r="2.3" />
      <circle cx="18" cy="18" r="2.3" />
      <path d="M8.1 10.8l7.8-3.6M8.1 13.2l7.8 3.6" />
    </>
  ),
  bell: (
    <>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </>
  ),
  sliders: (
    <>
      <line x1="6" y1="4" x2="6" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="18" y1="4" x2="18" y2="20" />
      <circle cx="6" cy="9" r="2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="7" r="2" fill="currentColor" stroke="none" />
    </>
  ),
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 18, className = '', ...props }: IconProps) {
  const filled = name === 'heart-filled'

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
