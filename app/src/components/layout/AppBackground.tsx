export function AppBackground() {
  return (
    <>
      <div
        className="fixed inset-0 -z-10 opacity-75 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/mobile.webp')" }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-[rgba(10,24,16,0.3)] via-[rgba(26,15,15,0.2)] to-[rgba(10,24,16,0.3)]" />
    </>
  );
}
