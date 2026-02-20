import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFirst = vi.fn();
const mockSet = vi.fn();
const mockSave = vi.fn();

vi.mock('@/lib/parse', () => {
  function MockParseObject() {
    return { set: mockSet, save: mockSave, get: vi.fn() };
  }
  MockParseObject.createWithoutData = vi.fn().mockReturnValue({ id: 'pointer' });

  function MockQuery() {
    return { equalTo: vi.fn(), first: mockFirst, find: vi.fn().mockResolvedValue([]) };
  }

  return {
    default: {
      Object: {
        extend: vi.fn().mockReturnValue(MockParseObject),
      },
      Query: MockQuery,
    },
  };
});

import { getPreferences, updatePreferences, createDefaultPreferences } from '@/lib/preferences';

describe('getPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no preference found', async () => {
    mockFirst.mockResolvedValue(null);
    const result = await getPreferences('sub-123');
    expect(result).toBeNull();
  });

  it('returns preferences from Parse object', async () => {
    const data: Record<string, unknown> = {
      notifyNewEvents: true,
      notifyTimeChanges: false,
      notifyScoreUpdates: true,
      reminderHours: [24],
      enabledSports: ['football-men'],
      disabled: false,
    };
    mockFirst.mockResolvedValue({
      get: (key: string) => data[key],
    });

    const result = await getPreferences('sub-123');
    expect(result).toEqual({
      notifyNewEvents: true,
      notifyTimeChanges: false,
      notifyScoreUpdates: true,
      reminderHours: [24],
      enabledSports: ['football-men'],
      disabled: false,
    });
  });
});

describe('updatePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when no preference found', async () => {
    mockFirst.mockResolvedValue(null);
    await updatePreferences('sub-123', { notifyNewEvents: false });
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('updates and saves when preference found', async () => {
    const mockObj = { set: mockSet, save: mockSave.mockResolvedValue(undefined) };
    mockFirst.mockResolvedValue(mockObj);

    await updatePreferences('sub-123', { notifyNewEvents: false, disabled: true });
    expect(mockSet).toHaveBeenCalledWith('notifyNewEvents', false);
    expect(mockSet).toHaveBeenCalledWith('disabled', true);
    expect(mockSave).toHaveBeenCalled();
  });
});

describe('createDefaultPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when preferences already exist', async () => {
    mockFirst.mockResolvedValue({ id: 'existing' });
    await createDefaultPreferences('sub-123');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('creates default preferences when none exist', async () => {
    mockFirst.mockResolvedValue(null);
    mockSave.mockResolvedValue(undefined);

    await createDefaultPreferences('sub-123');
    expect(mockSet).toHaveBeenCalledWith('notifyNewEvents', true);
    expect(mockSet).toHaveBeenCalledWith('notifyTimeChanges', true);
    expect(mockSet).toHaveBeenCalledWith('notifyScoreUpdates', true);
    expect(mockSet).toHaveBeenCalledWith('subscription', expect.anything());
    expect(mockSave).toHaveBeenCalled();
  });
});
