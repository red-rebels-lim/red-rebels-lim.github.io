import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppBackground } from '@/components/layout/AppBackground';
import { Marquee } from '@/components/layout/Marquee';
import { CalendarPage } from '@/pages/CalendarPage';
import { BottomNav } from '@/components/layout/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trackEvent } from '@/lib/analytics';

const StatsPage = lazy(() => import('@/pages/StatsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function PageSkeleton() {
  return (
    <div className="w-full mx-auto pb-24 animate-pulse" role="status">
      <div className="h-10 bg-muted rounded-lg mx-2 mt-4 mb-6" />
      <div className="space-y-4 mx-2">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted/60 rounded-xl" />
          <div className="h-24 bg-muted/60 rounded-xl" />
        </div>
        <div className="h-40 bg-muted/40 rounded-xl" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackEvent('page_view', { page_path: location.pathname });
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <PageViewTracker />
      <AppBackground />
      <div className="neon-top-line" aria-hidden="true" />
      <Marquee />
      <main className="min-h-screen p-4 pb-20 font-['Barlow',sans-serif]">
        <div className="max-w-3xl mx-auto">
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<CalendarPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        </div>
      </main>
      <BottomNav />
    </HashRouter>
  );
}
