import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

// We'll mock the hook to control tour state precisely
const mockNext = vi.fn();
const mockPrev = vi.fn();
const mockSkip = vi.fn();

const defaultSteps = [
  { targetSelector: '[data-tour="calendar"]', titleKey: 'onboarding.step1Title', descriptionKey: 'onboarding.step1Desc' },
  { targetSelector: '[data-tour="filters"]', titleKey: 'onboarding.step2Title', descriptionKey: 'onboarding.step2Desc' },
  { targetSelector: '[data-tour="stats"]', titleKey: 'onboarding.step3Title', descriptionKey: 'onboarding.step3Desc' },
  { targetSelector: '[data-tour="settings"]', titleKey: 'onboarding.step4Title', descriptionKey: 'onboarding.step4Desc' },
  { targetSelector: '[data-tour="export"]', titleKey: 'onboarding.step5Title', descriptionKey: 'onboarding.step5Desc' },
];

let mockHookReturn = {
  isActive: true,
  currentStep: 0,
  steps: defaultSteps,
  next: mockNext,
  prev: mockPrev,
  skip: mockSkip,
};

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: () => mockHookReturn,
}));

import { OnboardingTour } from '@/components/OnboardingTour';

describe('Task 18: OnboardingTour component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn = {
      isActive: true,
      currentStep: 0,
      steps: defaultSteps,
      next: mockNext,
      prev: mockPrev,
      skip: mockSkip,
    };
  });

  describe('Acceptance Criteria', () => {
    it('should render when tour is active', () => {
      render(<OnboardingTour />);
      screen.getByRole('dialog');
    });

    it('should not render when tour is inactive', () => {
      mockHookReturn = { ...mockHookReturn, isActive: false };
      render(<OnboardingTour />);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('should display current step title and description via i18n keys', () => {
      render(<OnboardingTour />);
      screen.getByText('onboarding.step1Title');
      screen.getByText('onboarding.step1Desc');
    });

    it('should show skip button', () => {
      render(<OnboardingTour />);
      screen.getByText('onboarding.skip');
    });

    it('should call skip when skip button clicked', () => {
      render(<OnboardingTour />);
      fireEvent.click(screen.getByText('onboarding.skip'));
      expect(mockSkip).toHaveBeenCalled();
    });

    it('should show next button', () => {
      render(<OnboardingTour />);
      screen.getByText('onboarding.next');
    });

    it('should call next when next button clicked', () => {
      render(<OnboardingTour />);
      fireEvent.click(screen.getByText('onboarding.next'));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not show prev button on first step', () => {
      render(<OnboardingTour />);
      expect(screen.queryByText('onboarding.prev')).toBeNull();
    });

    it('should show prev button on steps after first', () => {
      mockHookReturn = { ...mockHookReturn, currentStep: 2 };
      render(<OnboardingTour />);
      screen.getByText('onboarding.prev');
    });

    it('should call prev when prev button clicked', () => {
      mockHookReturn = { ...mockHookReturn, currentStep: 2 };
      render(<OnboardingTour />);
      fireEvent.click(screen.getByText('onboarding.prev'));
      expect(mockPrev).toHaveBeenCalled();
    });

    it('should show "finish" text on last step instead of "next"', () => {
      mockHookReturn = { ...mockHookReturn, currentStep: 4 };
      render(<OnboardingTour />);
      screen.getByText('onboarding.finish');
      expect(screen.queryByText('onboarding.next')).toBeNull();
    });

    it('should show step counter (e.g., 1/5)', () => {
      render(<OnboardingTour />);
      screen.getByText('1 / 5');
    });

    it('should update step counter for different steps', () => {
      mockHookReturn = { ...mockHookReturn, currentStep: 3 };
      render(<OnboardingTour />);
      screen.getByText('4 / 5');
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog" with aria-label', () => {
      render(<OnboardingTour />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-label')).toBe('onboarding.tourLabel');
    });

    it('should render a backdrop overlay', () => {
      const { container } = render(<OnboardingTour />);
      const overlay = container.querySelector('[data-testid="tour-overlay"]');
      expect(overlay).not.toBeNull();
    });
  });
});
