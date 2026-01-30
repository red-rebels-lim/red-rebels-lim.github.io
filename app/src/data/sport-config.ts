import type { Sport, SportConfig } from '@/types/events';

export const sportConfig: Record<Sport, SportConfig> = {
  'football-men': { emoji: '\u{1F468}\u26BD', name: 'Men\'s Football' },
  'volleyball-men': { emoji: '\u{1F468}\u{1F3D0}', name: 'Men\'s Volleyball' },
  'volleyball-women': { emoji: '\u{1F469}\u{1F3FB}\u{1F3D0}', name: 'Women\'s Volleyball' },
  'meeting': { emoji: '', name: 'Meeting' },
};
