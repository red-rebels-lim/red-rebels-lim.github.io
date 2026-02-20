import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AppBackground } from '@/components/layout/AppBackground';

describe('AppBackground', () => {
  it('renders desktop and mobile background divs', () => {
    const { container } = render(<AppBackground />);
    const divs = container.querySelectorAll('div');
    // desktop bg, mobile bg, dark overlay = 3 inner divs
    expect(divs.length).toBeGreaterThanOrEqual(3);
  });

  it('includes background image references', () => {
    const { container } = render(<AppBackground />);
    const html = container.innerHTML;
    expect(html).toContain('main.webp');
    expect(html).toContain('mobile.webp');
  });
});
