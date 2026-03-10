export function AppBackground() {
  return (
    <>
      {/* Desktop background */}
      <div className="fixed inset-0 -z-10 hidden md:flex opacity-75 pointer-events-none overflow-hidden">
        <img src="/images/main.webp" alt="" className="w-full h-full object-cover object-center" />
      </div>
      {/* Mobile background — img element avoids iOS background-attachment scroll issues */}
      <div className="fixed inset-0 -z-10 md:hidden opacity-75 pointer-events-none overflow-hidden">
        <img src="/images/mobile.webp" alt="" className="w-full h-full object-cover object-center" />
      </div>
      {/* Dark overlay */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-[rgba(10,24,16,0.3)] via-[rgba(26,15,15,0.2)] to-[rgba(10,24,16,0.3)]" />
    </>
  );
}
