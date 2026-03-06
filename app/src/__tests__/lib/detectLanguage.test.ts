import { describe, it, expect, beforeEach } from 'vitest';
import { detectLanguage } from '@/i18n/detectLanguage';

describe('Task 19: detectLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Acceptance Criteria', () => {
    it('should return "el" when browser language is Greek and no saved preference', () => {
      const result = detectLanguage('el');
      expect(result).toBe('el');
    });

    it('should return "el" when browser language is Greek with region (el-GR)', () => {
      const result = detectLanguage('el-GR');
      expect(result).toBe('el');
    });

    it('should return "en" when browser language is English and no saved preference', () => {
      const result = detectLanguage('en');
      expect(result).toBe('en');
    });

    it('should return "en" when browser language is English with region (en-US)', () => {
      const result = detectLanguage('en-US');
      expect(result).toBe('en');
    });

    it('should return saved "el" when localStorage has "el"', () => {
      localStorage.setItem('language', 'el');
      const result = detectLanguage('en');
      expect(result).toBe('el');
    });

    it('should return saved "en" when localStorage has "en"', () => {
      localStorage.setItem('language', 'en');
      const result = detectLanguage('el');
      expect(result).toBe('en');
    });

    it('should map legacy "gr" localStorage value to "el"', () => {
      localStorage.setItem('language', 'gr');
      const result = detectLanguage('en');
      expect(result).toBe('el');
    });

    it('should prioritize saved preference over browser language', () => {
      localStorage.setItem('language', 'en');
      const result = detectLanguage('el-GR');
      expect(result).toBe('en');
    });
  });

  describe('Edge Cases', () => {
    it('should default to "en" for unsupported browser languages (e.g., "fr")', () => {
      const result = detectLanguage('fr');
      expect(result).toBe('en');
    });

    it('should default to "en" for empty browser language string', () => {
      const result = detectLanguage('');
      expect(result).toBe('en');
    });

    it('should default to "en" when no browser language and no saved preference', () => {
      const result = detectLanguage(undefined as unknown as string);
      expect(result).toBe('en');
    });
  });
});
