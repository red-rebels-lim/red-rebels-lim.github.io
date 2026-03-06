import { useState, useCallback } from 'react';

const STORAGE_KEY = 'onboarding-completed';

export interface OnboardingStep {
  targetSelector: string;
  titleKey: string;
  descriptionKey: string;
}

const STEPS: OnboardingStep[] = [
  {
    targetSelector: '[data-tour="calendar"]',
    titleKey: 'onboarding.step1Title',
    descriptionKey: 'onboarding.step1Desc',
  },
  {
    targetSelector: '[data-tour="filters"]',
    titleKey: 'onboarding.step2Title',
    descriptionKey: 'onboarding.step2Desc',
  },
  {
    targetSelector: '[data-tour="stats"]',
    titleKey: 'onboarding.step3Title',
    descriptionKey: 'onboarding.step3Desc',
  },
  {
    targetSelector: '[data-tour="settings"]',
    titleKey: 'onboarding.step4Title',
    descriptionKey: 'onboarding.step4Desc',
  },
  {
    targetSelector: '[data-tour="export"]',
    titleKey: 'onboarding.step5Title',
    descriptionKey: 'onboarding.step5Desc',
  },
];

export function useOnboarding() {
  const [isActive, setIsActive] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== 'true'
  );
  const [currentStep, setCurrentStep] = useState(0);

  const complete = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const next = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= STEPS.length - 1) {
        complete();
        return prev;
      }
      return prev + 1;
    });
  }, [complete]);

  const prev = useCallback(() => {
    setCurrentStep((p) => Math.max(0, p - 1));
  }, []);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  return {
    isActive,
    currentStep,
    steps: STEPS,
    next,
    prev,
    skip,
  };
}
