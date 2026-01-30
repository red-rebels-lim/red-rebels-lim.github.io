export function AppBackground() {
  return (
    <>
      {/* Desktop background */}
      <div
        className="fixed inset-0 -z-10 hidden md:block bg-cover bg-center bg-no-repeat bg-fixed opacity-75 pointer-events-none"
        style={{ backgroundImage: 'url(/images/main.jpeg)' }}
      />
      {/* Mobile background */}
      <div
        className="fixed inset-0 -z-10 md:hidden bg-cover bg-center bg-no-repeat bg-fixed opacity-75 pointer-events-none"
        style={{ backgroundImage: 'url(/images/mobile.jpeg)' }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-[rgba(10,24,16,0.3)] via-[rgba(26,15,15,0.2)] to-[rgba(10,24,16,0.3)]" />
    </>
  );
}
