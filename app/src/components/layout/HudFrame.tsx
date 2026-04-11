import type { ReactNode } from 'react';
import { useVisualTheme } from '@/hooks/useVisualTheme';

interface HudFrameProps {
  children: ReactNode;
}

export function HudFrame({ children }: HudFrameProps) {
  const { theme } = useVisualTheme();
  const showHud = theme === 'neon';

  if (!showHud) return <>{children}</>;

  return (
    <div className="relative mx-2 my-3 p-1">
      <span className="hud-corner absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--neon-cyan,#00FFFF)]" aria-hidden="true" />
      <span className="hud-corner absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--neon-cyan,#00FFFF)]" aria-hidden="true" />
      <span className="hud-corner absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--neon-cyan,#00FFFF)]" aria-hidden="true" />
      <span className="hud-corner absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--neon-cyan,#00FFFF)]" aria-hidden="true" />
      {children}
    </div>
  );
}
