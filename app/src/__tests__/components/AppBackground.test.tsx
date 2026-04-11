import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AppBackground } from '@/components/layout/AppBackground';

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: true, toggle: vi.fn() }),
}));

describe('AppBackground', () => {
  it('renders background and dark overlay divs', () => {
    const { container } = render(<AppBackground />);
    const divs = container.querySelectorAll('div');
    // background + dark overlay + 2 ambient blobs = 4 inner divs
    expect(divs.length).toBeGreaterThanOrEqual(2);
  });

  it('includes mobile background image reference', () => {
    const { container } = render(<AppBackground />);
    const html = container.innerHTML;
    expect(html).toContain('mobile.webp');
  });

  it('renders ambient blobs in dark mode', () => {
    const { container } = render(<AppBackground />);
    expect(container.querySelectorAll('.ambient-blob').length).toBe(2);
  });
});
