import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockTheme } = vi.hoisted(() => ({ mockTheme: { value: 'default' } }));
vi.mock('@/hooks/useVisualTheme', () => ({
  useVisualTheme: () => ({ theme: mockTheme.value, setTheme: vi.fn(), themes: ['default', 'brutalism', 'cinema', 'neon'] }),
}));

import { HudFrame } from '@/components/layout/HudFrame';

describe('HudFrame', () => {
  it('renders children without decoration for default theme', () => {
    mockTheme.value = 'default';
    render(<HudFrame><span>content</span></HudFrame>);
    expect(screen.getByText('content')).toBeDefined();
    expect(document.querySelector('.hud-corner')).toBeNull();
  });

  it('renders corner brackets for neon theme', () => {
    mockTheme.value = 'neon';
    const { container } = render(<HudFrame><span>content</span></HudFrame>);
    expect(screen.getByText('content')).toBeDefined();
    expect(container.querySelectorAll('.hud-corner').length).toBe(4);
  });

  it('corner brackets have aria-hidden', () => {
    mockTheme.value = 'neon';
    const { container } = render(<HudFrame><span>content</span></HudFrame>);
    container.querySelectorAll('.hud-corner').forEach((el) => {
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('renders without decoration for brutalism', () => {
    mockTheme.value = 'brutalism';
    render(<HudFrame><span>content</span></HudFrame>);
    expect(document.querySelector('.hud-corner')).toBeNull();
  });
});
