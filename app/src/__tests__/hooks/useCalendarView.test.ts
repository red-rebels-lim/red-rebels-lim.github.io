import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarView } from '@/hooks/useCalendarView';

describe('useCalendarView', () => {
  beforeEach(() => {
    localStorage.removeItem('calendar_view');
  });

  it('defaults to grid', () => {
    const { result } = renderHook(() => useCalendarView());
    expect(result.current.view).toBe('grid');
  });

  it('reads saved view from localStorage', () => {
    localStorage.setItem('calendar_view', 'list');
    const { result } = renderHook(() => useCalendarView());
    expect(result.current.view).toBe('list');
  });

  it('setView persists to localStorage', () => {
    const { result } = renderHook(() => useCalendarView());
    act(() => result.current.setView('cards'));
    expect(localStorage.getItem('calendar_view')).toBe('cards');
  });

  it('returns current view after setView', () => {
    const { result } = renderHook(() => useCalendarView());
    act(() => result.current.setView('list'));
    expect(result.current.view).toBe('list');
  });

  it('invalid localStorage value falls back to grid', () => {
    localStorage.setItem('calendar_view', 'invalid');
    const { result } = renderHook(() => useCalendarView());
    expect(result.current.view).toBe('grid');
  });
});
