import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'calendar.viewGrid': 'Grid',
        'calendar.viewList': 'List',
        'calendar.viewCards': 'Cards',
      };
      return map[key] ?? key;
    },
  }),
}));

import { ViewSwitcher } from '@/components/calendar/ViewSwitcher';

describe('ViewSwitcher', () => {
  it('renders 3 buttons', () => {
    render(<ViewSwitcher view="grid" onViewChange={() => {}} />);
    expect(screen.getByText('Grid')).toBeDefined();
    expect(screen.getByText('List')).toBeDefined();
    expect(screen.getByText('Cards')).toBeDefined();
  });

  it('marks the active view with aria-pressed', () => {
    render(<ViewSwitcher view="list" onViewChange={() => {}} />);
    expect(screen.getByText('List').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Grid').getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onViewChange when clicking a button', () => {
    const onChange = vi.fn();
    render(<ViewSwitcher view="grid" onViewChange={onChange} />);
    fireEvent.click(screen.getByText('Cards'));
    expect(onChange).toHaveBeenCalledWith('cards');
  });

  it('does not call onViewChange for already active view', () => {
    const onChange = vi.fn();
    render(<ViewSwitcher view="grid" onViewChange={onChange} />);
    fireEvent.click(screen.getByText('Grid'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
