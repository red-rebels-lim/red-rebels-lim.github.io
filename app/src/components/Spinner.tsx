export function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status">
      <div className="w-10 h-10 border-4 border-primary-border border-t-primary rounded-full animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
