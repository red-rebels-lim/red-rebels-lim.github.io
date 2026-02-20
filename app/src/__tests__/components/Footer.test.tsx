import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { Footer } from '@/components/layout/Footer';

describe('Footer', () => {
  it('renders the legend title', () => {
    render(<Footer />);
    expect(screen.getByText('legend.title')).toBeDefined();
  });

  it('renders all sport items', () => {
    render(<Footer />);
    expect(screen.getByText('sports.footballMen')).toBeDefined();
    expect(screen.getByText('sports.volleyballMen')).toBeDefined();
    expect(screen.getByText('sports.volleyballWomen')).toBeDefined();
  });
});
