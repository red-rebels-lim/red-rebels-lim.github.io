import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from '@/hooks/useOnboarding';

const STORAGE_KEY = 'onboarding-completed';

describe('Task 18: useOnboarding hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Acceptance Criteria', () => {
    it('should start the tour on first visit (no localStorage flag)', () => {
      const { result } = renderHook(() => useOnboarding());
      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStep).toBe(0);
    });

    it('should not start the tour if onboarding-completed flag exists', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      const { result } = renderHook(() => useOnboarding());
      expect(result.current.isActive).toBe(false);
    });

    it('should have 5 tour steps', () => {
      const { result } = renderHook(() => useOnboarding());
      expect(result.current.steps.length).toBe(5);
    });

    it('should advance to next step', () => {
      const { result } = renderHook(() => useOnboarding());
      act(() => result.current.next());
      expect(result.current.currentStep).toBe(1);
    });

    it('should go back to previous step', () => {
      const { result } = renderHook(() => useOnboarding());
      act(() => result.current.next());
      act(() => result.current.prev());
      expect(result.current.currentStep).toBe(0);
    });

    it('should not go below step 0', () => {
      const { result } = renderHook(() => useOnboarding());
      act(() => result.current.prev());
      expect(result.current.currentStep).toBe(0);
    });

    it('should complete tour and set localStorage when advancing past last step', () => {
      const { result } = renderHook(() => useOnboarding());
      const totalSteps = result.current.steps.length;
      for (let i = 0; i < totalSteps; i++) {
        act(() => result.current.next());
      }
      expect(result.current.isActive).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('should dismiss tour and set localStorage when skip is called', () => {
      const { result } = renderHook(() => useOnboarding());
      act(() => result.current.skip());
      expect(result.current.isActive).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('should not show again after completion (remount)', () => {
      const { result, unmount } = renderHook(() => useOnboarding());
      act(() => result.current.skip());
      unmount();

      const { result: result2 } = renderHook(() => useOnboarding());
      expect(result2.current.isActive).toBe(false);
    });
  });

  describe('Step Definitions', () => {
    it('each step should have a targetSelector, titleKey, and descriptionKey', () => {
      const { result } = renderHook(() => useOnboarding());
      for (const step of result.current.steps) {
        expect(step.targetSelector).toBeTruthy();
        expect(step.titleKey).toBeTruthy();
        expect(step.descriptionKey).toBeTruthy();
      }
    });

    it('step keys should use onboarding i18n namespace', () => {
      const { result } = renderHook(() => useOnboarding());
      for (const step of result.current.steps) {
        expect(step.titleKey).toMatch(/^onboarding\./);
        expect(step.descriptionKey).toMatch(/^onboarding\./);
      }
    });
  });
});
