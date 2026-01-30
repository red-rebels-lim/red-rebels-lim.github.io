import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppBackground } from '@/components/layout/AppBackground';
import { CalendarPage } from '@/pages/CalendarPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Spinner } from '@/components/Spinner';

const StatsPage = lazy(() => import('@/pages/StatsPage'));

export default function App() {
  return (
    <HashRouter>
      <AppBackground />
      <div className="min-h-screen p-4 md:p-8 font-['Montserrat',sans-serif]">
        <ErrorBoundary>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={<CalendarPage />} />
              <Route path="/stats" element={<StatsPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </HashRouter>
  );
}
