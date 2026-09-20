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
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.6M12 18.6v2.6M4.6 5.6l1.9 1.9M17.5 16.5l1.9 1.9M2.8 12h2.6M18.6 12h2.6M4.6 18.4l1.9-1.9M17.5 7.5l1.9-1.9" />
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
