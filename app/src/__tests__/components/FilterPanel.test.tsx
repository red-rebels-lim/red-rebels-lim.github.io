import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children as React.ReactNode}</option>
  ),
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

  it('calls onApply with updated sport when sport select changes', () => {
    const onApply = vi.fn();
    render(<FilterPanel open={true} filters={defaultFilters} onApply={onApply} onClear={vi.fn()} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'football-men' } });
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ sport: 'football-men' }));
  });

  it('calls onApply with updated location when location select changes', () => {
    const onApply = vi.fn();
    render(<FilterPanel open={true} filters={defaultFilters} onApply={onApply} onClear={vi.fn()} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'home' } });
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ location: 'home' }));
  });

  it('calls onApply with updated status when status select changes', () => {
    const onApply = vi.fn();
    render(<FilterPanel open={true} filters={defaultFilters} onApply={onApply} onClear={vi.fn()} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: 'played' } });
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ status: 'played' }));
  });
});
