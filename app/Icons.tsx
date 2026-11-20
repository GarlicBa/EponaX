import type { ReactNode } from 'react';
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" />,
    pause: <path d="M8 5v14M16 5v14" strokeWidth="3" />,
    replay: <path d="M4 9a8 8 0 1 1 0 6M4 4v5h5" />,
    layers: <path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5" />,
    camera: <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="m8 6 1-3h6l1 3" /><circle cx="12" cy="13" r="3.5" /></>,
    expand: <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    back: <path d="m15 6-7 6 7 6M5 5v14" />,
    next: <path d="m9 6 7 6-7 6M19 5v14" />,
    route: <><circle cx="5" cy="18" r="2" /><circle cx="19" cy="5" r="2" /><path d="M5 16v-5a3 3 0 0 1 3-3h8a3 3 0 0 0 3-3" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.layers}</svg>;
}
