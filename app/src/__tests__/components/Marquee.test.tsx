import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const { mockTheme } = vi.hoisted(() => ({ mockTheme: { value: 'default' } }));
vi.mock('@/hooks/useVisualTheme', () => ({
  useVisualTheme: () => ({ theme: mockTheme.value, setTheme: vi.fn(), themes: ['default', 'brutalism', 'cinema', 'neon'] }),
}));

import { Marquee } from '@/components/layout/Marquee';

describe('Marquee', () => {
  it('renders nothing when theme is default', () => {
    mockTheme.value = 'default';
    const { container } = render(<Marquee />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when theme is cinema', () => {
    mockTheme.value = 'cinema';
    const { container } = render(<Marquee />);
    expect(container.innerHTML).toBe('');
  });

  it('renders scrolling content when theme is brutalism', () => {
    mockTheme.value = 'brutalism';
    const { container } = render(<Marquee />);
    expect(container.querySelector('.marquee')).not.toBeNull();
    expect(container.textContent).toContain('common.appName');
  });

  it('has aria-hidden on the marquee', () => {
    mockTheme.value = 'brutalism';
    render(<Marquee />);
    const el = screen.getByRole('presentation', { hidden: true });
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('contains sport labels', () => {
    mockTheme.value = 'brutalism';
    const { container } = render(<Marquee />);
    const text = container.textContent ?? '';
    expect(text).toContain('sports.footballMen');
    expect(text).toContain('sports.volleyballMen');
  });
});
