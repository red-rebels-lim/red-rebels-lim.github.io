import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { MonthName } from '@/types/events';
import { trackEvent } from '@/lib/analytics';

interface MonthNavigationProps {
  currentMonth: MonthName;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function MonthNavigation({ currentMonth, onPrevious, onNext, onToday }: MonthNavigationProps) {
  const { t } = useTranslation();

  const handlePrevious = () => { trackEvent('navigate_month', { direction: 'previous' }); onPrevious(); };
  const handleNext = () => { trackEvent('navigate_month', { direction: 'next' }); onNext(); };
  const handleToday = () => { trackEvent('navigate_month', { direction: 'today' }); onToday(); };

  return (
    <div className="mb-6 print:hidden">
      {/* Desktop: all in one row */}
      <div className="hidden md:flex items-center justify-center gap-3">
        <Button
          onClick={handlePrevious}
          variant="outline"
          className="min-h-[44px] border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] backdrop-blur-sm hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground font-semibold"
        >
          {t('monthNav.previous')}
        </Button>

        <div className="min-w-[200px] text-center px-8 py-3 text-2xl font-extrabold uppercase tracking-wide text-foreground bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)] backdrop-blur-sm border-2 border-[rgba(224,37,32,0.4)] rounded-xl">
          {t(`months.${currentMonth}`)}
        </div>

        <Button
          onClick={handleNext}
          variant="outline"
          className="min-h-[44px] border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] backdrop-blur-sm hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground font-semibold"
        >
          {t('monthNav.next')}
        </Button>

        <Button
          onClick={handleToday}
          className="min-h-[44px] bg-gradient-to-br from-[#E02520] to-[#b91c1c] text-white border-2 border-[#E02520] font-bold uppercase shadow-[0_8px_20px_rgba(224,37,32,0.4)] hover:from-[#b91c1c] hover:to-[#991b1b]"
        >
          {t('monthNav.jumpToToday')}
        </Button>
      </div>

      {/* Mobile: month on top, buttons below */}
      <div className="flex flex-col items-center gap-3 md:hidden">
        <div className="min-w-[180px] text-center px-6 py-3 text-xl font-extrabold uppercase tracking-wide text-foreground bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)] backdrop-blur-sm border-2 border-[rgba(224,37,32,0.4)] rounded-xl">
          {t(`months.${currentMonth}`)}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePrevious}
            variant="outline"
            className="min-h-[44px] min-w-[44px] border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] backdrop-blur-sm hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground font-semibold"
          >
            {t('monthNav.previous')}
          </Button>

          <Button
            onClick={handleToday}
            className="min-h-[44px] bg-gradient-to-br from-[#E02520] to-[#b91c1c] text-white border-2 border-[#E02520] font-bold uppercase shadow-[0_8px_20px_rgba(224,37,32,0.4)] hover:from-[#b91c1c] hover:to-[#991b1b]"
          >
            {t('monthNav.jumpToToday')}
          </Button>

          <Button
            onClick={handleNext}
            variant="outline"
            className="min-h-[44px] min-w-[44px] border-[rgba(224,37,32,0.3)] bg-[rgba(255,255,255,0.05)] backdrop-blur-sm hover:bg-[rgba(224,37,32,0.15)] hover:border-[#E02520] text-foreground font-semibold"
          >
            {t('monthNav.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
