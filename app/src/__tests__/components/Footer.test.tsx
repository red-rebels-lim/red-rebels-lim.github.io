import { describe, it, vi } from 'vitest';
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
    screen.getByText('legend.title');
  });

  it('renders all sport items', () => {
    render(<Footer />);
    screen.getByText('sports.footballMen');
    screen.getByText('sports.volleyballMen');
    screen.getByText('sports.volleyballWomen');
  });
});
