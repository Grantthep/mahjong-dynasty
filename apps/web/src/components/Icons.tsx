interface IconProps {
  size?: number;
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function GearIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base}>
      <path
        d="M21.85 10.26 21.85 13.74 18.89 13.22 17.73 16.02 20.19 17.74 17.74 20.19 16.02 17.73 13.22 18.89 13.74 21.85 10.26 21.85 10.78 18.89 7.98 17.73 6.26 20.19 3.81 17.74 6.27 16.02 5.11 13.22 2.15 13.74 2.15 10.26 5.11 10.78 6.27 7.98 3.81 6.26 6.26 3.81 7.98 6.27 10.78 5.11 10.26 2.15 13.74 2.15 13.22 5.11 16.02 6.27 17.74 3.81 20.19 6.26 17.73 7.98 18.89 10.78Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.3" />
    </svg>
  );
}

export function PaytableIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base}>
      <rect x="4" y="4.5" width="16" height="15" rx="2" />
      <path d="M4 9.5h16M4 14.5h16M10 4.5v15" />
    </svg>
  );
}

export function SoundIcon({ size = 22, muted = false }: IconProps & { muted?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base}>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
      {muted ? (
        <path d="M16 9.5l4.5 5M20.5 9.5L16 14.5" />
      ) : (
        <path d="M15.5 9a4.2 4.2 0 010 6M18 6.5a8 8 0 010 11" />
      )}
    </svg>
  );
}
