export function AppBackground() {
  return (
    <>
      <div
        className="fixed inset-0 -z-10 opacity-75 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/mobile.webp')" }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-surface-overlay via-surface-overlay/60 to-surface-overlay" />
    </>
  );
}
