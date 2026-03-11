export function AppBackground() {
  return (
    <>
      {/* Desktop background */}
      <div
        className="fixed inset-0 -z-10 hidden md:block opacity-75 pointer-events-none bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/main.webp')", backgroundSize: '120% 110%' }}
      />
      {/* Mobile background */}
      <div
        className="fixed inset-0 -z-10 md:hidden opacity-75 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/mobile.webp')" }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-[rgba(10,24,16,0.3)] via-[rgba(26,15,15,0.2)] to-[rgba(10,24,16,0.3)]" />
    </>
  );
}
