// Shared field options for the SoloSalamina data collections.
// Values mirror app/src/types/events.ts + players.ts — the frozen JSON contract.

export const SPORT_OPTIONS = [
  { label: 'Football (men)', value: 'football-men' },
  { label: 'Volleyball (men)', value: 'volleyball-men' },
  { label: 'Volleyball (women)', value: 'volleyball-women' },
  { label: 'Meeting', value: 'meeting' },
] as const

export const TEAM_SIDE_OPTIONS = [
  { label: 'Home', value: 'home' },
  { label: 'Away', value: 'away' },
] as const

export const POSITION_OPTIONS = [
  // football
  { label: 'Goalkeeper', value: 'GK' },
  { label: 'Defender', value: 'DEF' },
  { label: 'Midfielder', value: 'MID' },
  { label: 'Forward', value: 'FWD' },
  // volleyball
  { label: 'Setter', value: 'SETTER' },
  { label: 'Outside hitter', value: 'OUTSIDE' },
  { label: 'Opposite', value: 'OPPOSITE' },
  { label: 'Middle blocker', value: 'MIDDLE' },
  { label: 'Libero', value: 'LIBERO' },
] as const

export const SUB_POSITION_OPTIONS = [
  { label: 'Central', value: 'Central' },
  { label: 'Wing', value: 'Wing' },
  { label: 'Defensive', value: 'Defensive' },
  { label: 'Attacking', value: 'Attacking' },
] as const
