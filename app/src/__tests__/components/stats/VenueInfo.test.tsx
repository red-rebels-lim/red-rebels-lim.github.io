import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/lib/fotmob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/fotmob')>();
  return { ...actual, tApi: (_t: unknown, _ns: string, val: string) => val };
});

import { VenueInfo } from '@/components/stats/VenueInfo';

describe('VenueInfo', () => {
  it('renders venue name and city', () => {
    render(<VenueInfo venue={{ name: 'Ammochostos Stadium', city: 'Larnaca', capacity: '10000', surface: 'Grass', yearOpened: '2000' }} />);
    screen.getByText('Ammochostos Stadium');
    screen.getByText('Larnaca');
  });

  it('renders capacity when provided', () => {
    render(<VenueInfo venue={{ name: 'Test', city: 'City', capacity: '5000' }} />);
    screen.getByText('5000');
  });

  it('renders surface and year when provided', () => {
    render(<VenueInfo venue={{ name: 'Test', city: 'City', surface: 'Artificial', yearOpened: '1999' }} />);
    screen.getByText('Artificial');
    screen.getByText('1999');
  });
});
