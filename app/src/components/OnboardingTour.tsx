import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/hooks/useOnboarding';

export function OnboardingTour() {
  const { t } = useTranslation();
  const { isActive, currentStep, steps, next, prev, skip } = useOnboarding();

  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      skip();
      return;
    }
    // Focus trap: keep Tab within the dialog
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [skip]);

  useEffect(() => {
    if (!isActive) return;
    document.addEventListener('keydown', handleKeyDown);
    // Move focus into the dialog
    const timer = setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isActive, handleKeyDown]);

  if (!isActive) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      <div
        data-testid="tour-overlay"
        className="fixed inset-0 bg-black/60 z-[100]"
        onClick={skip}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('onboarding.tourLabel')}
        tabIndex={-1}
        className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-white dark:bg-[#1a0f0f] border-2 border-[rgba(224,37,32,0.4)] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] outline-none"
      >
        <div className="text-sm text-[rgba(224,37,32,0.8)] font-semibold mb-1" role="status" aria-live="polite">
          {currentStep + 1} / {steps.length}
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">
          {t(step.titleKey)}
        </h2>
        <p className="text-sm text-foreground/80 mb-6">
          {t(step.descriptionKey)}
        </p>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={skip}
            className="text-sm text-foreground/60 hover:text-foreground/90 transition-colors"
          >
            {t('onboarding.skip')}
          </button>

          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={prev}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[rgba(224,37,32,0.3)] text-foreground hover:bg-[rgba(224,37,32,0.15)] transition-colors"
              >
                {t('onboarding.prev')}
              </button>
            )}
            <button
              onClick={next}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-gradient-to-br from-[#E02520] to-[#b91c1c] text-white border border-[#E02520] shadow-[0_4px_12px_rgba(224,37,32,0.4)] hover:from-[#b91c1c] hover:to-[#991b1b] transition-colors"
            >
              {isLast ? t('onboarding.finish') : t('onboarding.next')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
