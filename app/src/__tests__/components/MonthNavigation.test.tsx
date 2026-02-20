import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

import { MonthNavigation } from '@/components/calendar/MonthNavigation';

describe('MonthNavigation', () => {
  const defaultProps = {
    currentMonth: 'february' as const,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onToday: vi.fn(),
  };

  it('renders the current month name', () => {
    render(<MonthNavigation {...defaultProps} />);
    const monthElements = screen.getAllByText('months.february');
    expect(monthElements.length).toBeGreaterThan(0);
  });

  it('renders navigation buttons', () => {
    render(<MonthNavigation {...defaultProps} />);
    expect(screen.getAllByText('monthNav.previous').length).toBeGreaterThan(0);
    expect(screen.getAllByText('monthNav.next').length).toBeGreaterThan(0);
    expect(screen.getAllByText('monthNav.jumpToToday').length).toBeGreaterThan(0);
  });

  it('calls onPrevious when previous button is clicked', () => {
    render(<MonthNavigation {...defaultProps} />);
    const prevButtons = screen.getAllByText('monthNav.previous');
    fireEvent.click(prevButtons[0]);
    expect(defaultProps.onPrevious).toHaveBeenCalled();
  });

  it('calls onNext when next button is clicked', () => {
    render(<MonthNavigation {...defaultProps} />);
    const nextButtons = screen.getAllByText('monthNav.next');
    fireEvent.click(nextButtons[0]);
    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('calls onToday when jump to today button is clicked', () => {
    render(<MonthNavigation {...defaultProps} />);
    const todayButtons = screen.getAllByText('monthNav.jumpToToday');
    fireEvent.click(todayButtons[0]);
    expect(defaultProps.onToday).toHaveBeenCalled();
  });
});
