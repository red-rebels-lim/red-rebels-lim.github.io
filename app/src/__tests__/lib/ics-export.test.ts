import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCalendar } from '@/lib/ics-export';

describe('exportToCalendar', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    clickSpy = vi.fn();
    mockLink = { href: '', download: '', click: clickSpy };

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a download link and clicks it', () => {
    exportToCalendar();

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('sets the download filename to red-rebels-calendar-2025.ics', () => {
    exportToCalendar();
    expect(mockLink.download).toBe('red-rebels-calendar-2025.ics');
  });

  it('creates a blob URL', () => {
    exportToCalendar();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(mockLink.href).toBe('blob:test-url');
  });

  it('creates a Blob with text/calendar content type', () => {
    exportToCalendar();

    const blobArg = createObjectURLSpy.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe('text/calendar;charset=utf-8');
  });

  it('generated ICS content has VCALENDAR structure', async () => {
    exportToCalendar();

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blob.text();

    expect(text).toContain('BEGIN:VCALENDAR');
    expect(text).toContain('END:VCALENDAR');
    expect(text).toContain('VERSION:2.0');
    expect(text).toContain('PRODID:-//Red Rebels Calendar//EN');
    expect(text).toContain('METHOD:PUBLISH');
  });

  it('generated ICS contains VEVENT entries', async () => {
    exportToCalendar();

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blob.text();

    expect(text).toContain('BEGIN:VEVENT');
    expect(text).toContain('END:VEVENT');
  });

  it('VEVENTs have required fields', async () => {
    exportToCalendar();

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blob.text();

    // Extract first VEVENT
    const eventMatch = text.match(/BEGIN:VEVENT\r\n([\s\S]*?)END:VEVENT/);
    expect(eventMatch).not.toBeNull();

    const eventContent = eventMatch![1];
    expect(eventContent).toContain('UID:');
    expect(eventContent).toContain('DTSTAMP:');
    expect(eventContent).toContain('DTSTART:');
    expect(eventContent).toContain('DTEND:');
    expect(eventContent).toContain('SUMMARY:');
    expect(eventContent).toContain('DESCRIPTION:');
    expect(eventContent).toContain('CATEGORIES:');
  });

  it('home matches show "Νέα Σαλαμίνα vs Opponent"', async () => {
    exportToCalendar();

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blob.text();

    // There should be at least one home match with "Νέα Σαλαμίνα vs"
    expect(text).toContain('Νέα Σαλαμίνα vs');
  });

  it('events have STATUS field (CONFIRMED or TENTATIVE)', async () => {
    exportToCalendar();

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blob.text();

    const hasStatus = text.includes('STATUS:CONFIRMED') || text.includes('STATUS:TENTATIVE');
    expect(hasStatus).toBe(true);
  });

  it('sport categories include Greek sport names', async () => {
    exportToCalendar();

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blob.text();

    // At least one of these should be present
    const hasCategory =
      text.includes('CATEGORIES:Ανδρικό Ποδόσφαιρο') ||
      text.includes('CATEGORIES:Ανδρικό Βόλεϊ') ||
      text.includes('CATEGORIES:Γυναικείο Βόλεϊ');
    expect(hasCategory).toBe(true);
  });
});
