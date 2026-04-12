/**
 * Shared notification message builder.
 * Used by send-reminders.js, send-notifications.js, and channel senders (Telegram, Viber).
 */

export function sportEmoji(sport) {
  switch (sport) {
    case 'football-men': return '\u{1F468}\u26BD';
    case 'volleyball-men': return '\u{1F468}\u{1F3D0}';
    case 'volleyball-women': return '\u{1F469}\u{1F3FB}\u{1F3D0}';
    default: return '';
  }
}

/**
 * Build a match reminder notification payload.
 * @param {{ opponent: string, sport: string, location: string, venue?: string, time: string }} match
 * @param {number} tier - Hours before match (24, 12, 2, 1)
 * @returns {{ title: string, body: string, tag: string, url: string }}
 */
export function buildReminderPayload(match, tier) {
  const emoji = sportEmoji(match.sport);
  const prefix = emoji ? `${emoji} ` : '';
  const ha = match.location === 'home' ? 'H' : 'A';

  return {
    title: `${prefix}Match in ${tier}h`,
    body: `vs ${match.opponent} (${ha})${match.venue ? ` at ${match.venue}` : ''} — ${match.time}`,
    tag: `reminder-${tier}h-${match.eventKey}`,
    url: '/',
  };
}

/**
 * Build a change notification payload (new match, score update, time change).
 * @param {'added' | 'scoreUpdated' | 'timeUpdated'} type
 * @param {string} desc - Change description from scraper
 * @param {string | null} sport
 * @param {string | null} location
 * @returns {{ title: string, body: string, tag: string, url: string } | null}
 */
export function buildChangePayload(type, desc, sport, location) {
  const sportMatch = desc.match(/:\s*\S+\s+vs\s+(.+?)(?:\s*\(|$)/);
  const opponent = sportMatch ? sportMatch[1].trim() : '';
  const emoji = sportEmoji(sport);
  const prefix = emoji ? `${emoji} ` : '';
  const ha = location === 'home' ? ' (H)' : location === 'away' ? ' (A)' : '';

  switch (type) {
    case 'added':
      return {
        title: `${prefix}New Match`,
        body: opponent ? `vs ${opponent}${ha}` : desc,
        tag: `new-${desc.replace(/\s+/g, '-').toLowerCase()}`,
        url: '/',
      };
    case 'scoreUpdated': {
      const scoreMatch = desc.match(/\(([^)]+)\)/);
      return {
        title: `${prefix}Score Update`,
        body: opponent && scoreMatch ? `vs ${opponent}${ha} — ${scoreMatch[1]}` : desc,
        tag: `score-${desc.replace(/\s+/g, '-').toLowerCase()}`,
        url: '/',
      };
    }
    case 'timeUpdated': {
      const timeMatch = desc.match(/\(([^)]+)\)/);
      return {
        title: `${prefix}Time Changed`,
        body: opponent && timeMatch ? `vs ${opponent}${ha} — ${timeMatch[1]}` : desc,
        tag: `time-${desc.replace(/\s+/g, '-').toLowerCase()}`,
        url: '/',
      };
    }
    default:
      return null;
  }
}

/**
 * Format a notification payload as plain text for Telegram/Viber.
 * @param {{ title: string, body: string }} payload
 * @returns {string}
 */
export function formatPlainText(payload) {
  return `${payload.title}\n${payload.body}`;
}

/**
 * Format a notification payload as Telegram HTML.
 * @param {{ title: string, body: string }} payload
 * @returns {string}
 */
export function formatTelegramHtml(payload) {
  return `<b>${escapeHtml(payload.title)}</b>\n${escapeHtml(payload.body)}`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
