import type { TFunction } from 'i18next';
import i18next from 'i18next';
import { players } from '@/data/players';
import type { Player } from '@/types/players';

/**
 * Maps Greek team names (as stored in events.ts) to their English i18n keys
 * (as used in fotmob.teams in en.json / el.json).
 */
const GREEK_TO_TEAM_KEY: Record<string, string> = {
  // Football
  'ΝΕΑ ΣΑΛΑΜΙΝΑ': 'Nea Salamis',
  'Νέα Σαλαμίνα': 'Nea Salamis',
  'ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ': 'Doxa Katokopia',
  'ΗΡΑΚΛΗΣ ΓΕΡΟΛΑΚΚΟΥ': 'Iraklis Gerolakkou',
  'ΔΙΓΕΝΗΣ ΑΚΡΙΤΑΣ ΜΟΡΦΟΥ': 'Digenis Morphou',
  'Π.Ο. ΑΧΥΡΩΝΑΣ ΟΝΗΣΙΛΟΣ': 'PO Achyronas-Onisilos',
  'ΜΕΑΠ ΠΕΡΑ ΧΩΡΙΟΥ ΝΗΣΟΥ': 'MEAP Nisou',
  'ΧΑΛΚΑΝΟΡΑΣ ΙΔΑΛΙΟΥ': 'Chalkanoras Idaliou',
  'ΑΣΙΛ ΛΥΣΗΣ': 'ASIL Lysi',
  'ΑΕΖ ΖΑΚΑΚΙΟΥ': 'AEZ Zakakiou',
  'ΣΠΑΡΤΑΚΟΣ ΚΙΤΙΟΥ': 'Spartakos Kitiou',
  'ΕΘΝΙΚΟΣ ΛΑΤΣΙΩΝ': 'Ethnikos Latsion',
  'ΠΑΕΕΚ ΚΕΡΥΝΕΙΑΣ': 'PAEEK',
  'ΚΑΡΜΙΩΤΙΣΣΑ ΠΟΛΕΜΙΔΙΩΝ': 'Karmiotissa Pano Polemidion',
  'ΑΛΣ ΟΜΟΝΟΙΑ 29 Μ': 'Omonia 29 Maiou',
  'ΑΟΑΝ ΑΓΙΑΣ ΝΑΠΑΣ': 'Ayia Napa',
  'ΑΠΕΑ ΑΚΡΩΤΗΡΙΟΥ': 'APEA Akrotiri',
  // Volleyball (men)
  'ΑΝΟΡΘΩΣΙΣ': 'Anorthosis',
  'ΟΜΟΝΟΙΑ': 'Omonia',
  'OMONOIA': 'Omonia',
  'ΚΟΥΡΗΣ ΕΡΗΜΗΣ': 'Kouris Erimis',
  'ΠΑΦΙΑΚΟΣ': 'Pafiakos',
  'ΑΕΚ ΛΑΡΝΑΚΑΣ': 'AEK Larnaca',
  'ΑΕΛ': 'AEL',
  // Volleyball (women)
  'ΑΝΟΡΘΩΣΙΣ (Γ)': 'Anorthosis (W)',
  'ΑΕΛ (Γ)': 'AEL (W)',
  'ΑΕΚ ΛΑΡΝΑΚΑΣ (Γ)': 'AEK Larnaca (W)',
  'ΑΠΟΛΛΩΝ (Γ)': 'Apollon (W)',
  'ΟΛΥΜΠΙΑΔΑ Ν. (Γ)': 'Olympiada N. (W)',
  'LEMESOS VOLLEYBALL (Γ)': 'Lemesos Volleyball (W)',
  // Other
  'ΚΡΑΣΑΒΑ ΥΨΩΝΑ': 'Krasava Ypsona',
  'ΑΕ ΚΑΡΑΒΑ': 'AE Karava',
  'ΑΝΑΓΕΝΝΗΣΗ': 'Anagennisi',
  'ΑΠΟΕΛ': 'APOEL',
};

/**
 * Maps Greek venue names (as stored in events.ts) to their English i18n keys.
 */
const GREEK_TO_VENUE_KEY: Record<string, string> = {
  'Stadio Vitex Ammochostos Epistrofi': 'Stadio Vitex Ammochostos Epistrofi',
  'Αγίου Αθανασίου': 'Agiou Athanasiou',
  'Σπύρος Κυπριανού': 'Spyros Kyprianou',
  'Γυμνάσιο Αγίου Νεοφύτου': 'Gymnasio Agiou Neofytou',
  'Ελευθερία': 'Eleftheria',
  'ΓΗΠΕΔΟ ΟΛΥΜΠΙΑΔΑΣ ΛΥΜΠΙΩΝ': 'Olympiada Lympion',
  'Κίτιον': 'Kition',
  'Θεμιστόκλειο': 'Themistokleio',
  'Νεάπολη-Επιστροφή': 'Neapoli-Epistrofi',
  'Λευκόθεο': 'Lefkotheo',
  'Αφροδίτη': 'Afroditi',
  'Σωτήρειον': 'Sotireion',
  'Απόλλων': 'Apollon Stadium',
  'Δερύνειας': 'Deryneias',
  'Λύκειο Πολεμιδιών': 'Lykeio Polemidion',
  'ΓΗΠΕΔΟ "ΚΕΡΥΝΕΙΑ-ΕΠΙΣΤΡΟΦΗ"': 'Keryneia-Epistrofi',
  'ΚΟΙΝΟΤΙΚΟ ΓΗΠΕΔΟ ΠΑΝΩ ΠΟΛΕΜΙΔΙΩΝ': 'Pano Polemidion Community Stadium',
};

/**
 * Maps non-roster player names (volleyball scorers, opponent players) to English i18n keys.
 * Football roster names are resolved via players.ts; see `resolveRosterPlayer` below.
 */
const GREEK_TO_PLAYER_KEY: Record<string, string> = {};

/**
 * Lookup map built once at module load: every nameEl, nameEn, and alias entry from
 * players.ts → the Player record. Used by translatePlayerName to keep scorer / booking
 * display strings in sync with the roster file.
 */
const ROSTER_LOOKUP: Map<string, Player> = (() => {
  const map = new Map<string, Player>();
  for (const player of players) {
    map.set(normalisePlayerName(player.nameEl), player);
    map.set(normalisePlayerName(player.nameEn), player);
    for (const alias of player.aliases ?? []) {
      map.set(normalisePlayerName(alias), player);
    }
  }
  return map;
})();

/**
 * Normalise a player name from events.ts for lookup: strip parenthetical annotations
 * (e.g. "(Πέναλτι)"), collapse all whitespace, trim, and uppercase. Mirrors the
 * normalisation in the football-stats aggregator so the two stay consistent.
 */
export function normalisePlayerName(raw: string): string {
  return raw
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function resolveRosterPlayer(rawName: string): Player | undefined {
  return ROSTER_LOOKUP.get(normalisePlayerName(rawName));
}

export function getRosterPlayerKey(rawName: string): string | undefined {
  return resolveRosterPlayer(rawName)?.key;
}

/**
 * Translate a team name from the events data to the current language.
 * Falls back to the English key (or raw name if no mapping exists).
 */
export function translateTeamName(greekName: string, t: TFunction): string {
  const key = GREEK_TO_TEAM_KEY[greekName];
  if (!key) return greekName;
  const i18nKey = `fotmob.teams.${key}`;
  const translated = t(i18nKey, key);
  return typeof translated === 'string' ? translated : key;
}

/**
 * Translate a venue name from the events data to the current language.
 * Falls back to the English key (or raw name if no mapping exists).
 */
export function translateVenue(venueName: string, t: TFunction): string {
  const key = GREEK_TO_VENUE_KEY[venueName];
  if (!key) return venueName;
  const i18nKey = `fotmob.venue.${key}`;
  const translated = t(i18nKey, key);
  return typeof translated === 'string' ? translated : key;
}

/**
 * Translate a player name from the events data to the current language.
 *
 * Resolution order:
 *  1. Roster lookup against players.ts (handles every known name form via aliases).
 *     Returns player.nameEl when current language is 'el', player.nameEn otherwise.
 *  2. Legacy GREEK_TO_PLAYER_KEY map for non-roster names (e.g. volleyball scorers,
 *     historic opponents). Goes through i18n.
 *  3. Raw name unchanged if neither lookup matches.
 *
 * Player names in events.ts may have annotations like "(Πέναλτι)" — these are stripped
 * before lookup via normalisePlayerName.
 */
export function translatePlayerName(rawName: string, t: TFunction): string {
  const player = resolveRosterPlayer(rawName);
  if (player) {
    return i18next.language === 'el' ? player.nameEl : player.nameEn;
  }
  const cleaned = rawName.replace(/\s*\(.*?\)\s*/g, '').trim();
  const key = GREEK_TO_PLAYER_KEY[cleaned];
  if (!key) return rawName;
  const i18nKey = `fotmob.players.${key}`;
  const translated = t(i18nKey, key);
  return typeof translated === 'string' ? translated : key;
}
