import { describe, it, expect, vi } from 'vitest';
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
    expect(screen.getByText('Ammochostos Stadium')).toBeDefined();
    expect(screen.getByText('Larnaca')).toBeDefined();
  });

  it('renders capacity when provided', () => {
    render(<VenueInfo venue={{ name: 'Test', city: 'City', capacity: '5000' }} />);
    expect(screen.getByText('5000')).toBeDefined();
  });

  it('renders surface and year when provided', () => {
    render(<VenueInfo venue={{ name: 'Test', city: 'City', surface: 'Artificial', yearOpened: '1999' }} />);
    expect(screen.getByText('Artificial')).toBeDefined();
    expect(screen.getByText('1999')).toBeDefined();
  });
});
