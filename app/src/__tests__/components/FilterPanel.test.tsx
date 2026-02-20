import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { FilterPanel } from '@/components/filters/FilterPanel';

const defaultFilters = { sport: 'all', location: 'all', status: 'all', search: '' };

describe('FilterPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <FilterPanel open={false} filters={defaultFilters} onApply={vi.fn()} onClear={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders filter UI when open', () => {
    render(
      <FilterPanel open={true} filters={defaultFilters} onApply={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.getByText('filters.title')).toBeDefined();
    expect(screen.getByText('filters.sport')).toBeDefined();
    expect(screen.getByText('filters.location')).toBeDefined();
    expect(screen.getByText('filters.status')).toBeDefined();
  });

  it('renders search input', () => {
    render(
      <FilterPanel open={true} filters={defaultFilters} onApply={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.getByText('filters.searchOpponent')).toBeDefined();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(
      <FilterPanel open={true} filters={defaultFilters} onApply={vi.fn()} onClear={onClear} />
    );
    fireEvent.click(screen.getByText('filters.clearAll'));
    expect(onClear).toHaveBeenCalled();
  });

  it('updates search filter on input change', () => {
    const onApply = vi.fn();
    render(
      <FilterPanel open={true} filters={defaultFilters} onApply={onApply} onClear={vi.fn()} />
    );
    const input = screen.getByPlaceholderText('filters.searchPlaceholder');
    fireEvent.change(input, { target: { value: 'APOEL' } });
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ search: 'APOEL' }));
  });
});
