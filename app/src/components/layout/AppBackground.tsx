import { useTheme } from '@/hooks/useTheme';
import { useVisualTheme } from '@/hooks/useVisualTheme';

export function AppBackground() {
  const { isDark } = useTheme();
  const { theme } = useVisualTheme();
  const showPhoto = theme === 'default';

  return (
    <>
      {/* Stadium photo — default theme only */}
      {showPhoto && (
        <>
          <div
            className="fixed inset-0 -z-10 opacity-75 pointer-events-none bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/mobile.webp')" }}
          />
          <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-surface-overlay via-surface-overlay/60 to-surface-overlay" />
        </>
      )}
      {/* Ambient light blobs — default and cinema themes, dark mode only */}
      {isDark && (theme === 'default' || theme === 'cinema') && (
        <>
          <div className="ambient-blob ambient-blob-1" aria-hidden="true" />
          <div className="ambient-blob ambient-blob-2" aria-hidden="true" />
        </>
      )}
    </>
  );
}
