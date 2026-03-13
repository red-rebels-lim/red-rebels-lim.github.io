import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AppBackground } from '@/components/layout/AppBackground';

describe('AppBackground', () => {
  it('renders background and dark overlay divs', () => {
    const { container } = render(<AppBackground />);
    const divs = container.querySelectorAll('div');
    // background + dark overlay = 2 inner divs
    expect(divs.length).toBeGreaterThanOrEqual(2);
  });

  it('includes mobile background image reference', () => {
    const { container } = render(<AppBackground />);
    const html = container.innerHTML;
    expect(html).toContain('mobile.webp');
  });
});
