import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppBackground } from '@/components/layout/AppBackground';
import { CalendarPage } from '@/pages/CalendarPage';
import { BottomNav } from '@/components/layout/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Spinner } from '@/components/Spinner';
import { trackEvent } from '@/lib/analytics';

const StatsPage = lazy(() => import('@/pages/StatsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

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
      <main className="min-h-screen p-4 md:px-8 md:pt-8 md:pb-0 font-['Montserrat',sans-serif]">
        <ErrorBoundary>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={<CalendarPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <BottomNav />
    </HashRouter>
  );
}
