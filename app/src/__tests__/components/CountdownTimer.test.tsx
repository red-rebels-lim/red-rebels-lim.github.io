import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { CountdownTimer } from '@/components/calendar/CountdownTimer';

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when timestamp is in the past', () => {
    vi.setSystemTime(new Date('2026-03-01T12:00:00'));
    const { container } = render(<CountdownTimer timestamp={new Date('2026-02-01T12:00:00').getTime()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders countdown text when timestamp is in the future', () => {
    vi.setSystemTime(new Date('2026-02-20T10:00:00'));
    const futureTimestamp = new Date('2026-02-21T15:00:00').getTime();
    const { container } = render(<CountdownTimer timestamp={futureTimestamp} />);
    expect(container.textContent).not.toBe('');
  });
});
