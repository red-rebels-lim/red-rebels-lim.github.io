import type { CollectionConfig } from 'payload'
import { dataVersionHooks } from '../lib/dataVersion'
import { computeEventKey } from '../lib/eventKey'
import { SPORT_OPTIONS, TEAM_SIDE_OPTIONS } from './shared'

const teamSideField = {
  name: 'team',
  type: 'select' as const,
  required: true,
  options: [...TEAM_SIDE_OPTIONS],
}

const lineupPlayerFields = [
  { name: 'name', type: 'text' as const, required: true },
  { name: 'number', type: 'number' as const },
  { name: 'position', type: 'text' as const },
]

export const Fixtures: CollectionConfig = {
  slug: 'fixtures',
  // Saved list-view filters ("Presets" dropdown): filters + columns + sort.
  enableQueryPresets: true,
  admin: {
    useAsTitle: 'opponentName',
    defaultColumns: ['kickoff', 'sport', 'opponentName', 'location', 'status', 'score'],
    description:
      'This database is the source of truth — scripts never write to it. Live-edit flow: set status to "live" at kickoff, edit the score during the match, set "played" + final score at full time.',
  },
  defaultSort: '-kickoff',
  // The legacy eventKey carries no year, so league fixtures recur across
  // seasons — uniqueness is per (season, eventKey), never global.
  indexes: [{ fields: ['season', 'eventKey'], unique: true }],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.kickoff && data?.sport && data?.opponentName) {
          data.eventKey = computeEventKey(data.kickoff, data.sport, data.opponentName)
        }
        return data
      },
    ],
    ...dataVersionHooks,
  },
  fields: [
    { name: 'season', type: 'relationship', relationTo: 'seasons', required: true, index: true },
    { name: 'sport', type: 'select', required: true, index: true, options: [...SPORT_OPTIONS] },
    {
      name: 'kickoff',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd MMM yyyy HH:mm' },
        description: 'Stored UTC; legacy month/day/time are derived as Cyprus wall-clock.',
      },
    },
    {
      name: 'dateTbd',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'CFA draw fixture without a confirmed date — kickoff holds the matchday-window start.',
      },
    },
    {
      name: 'timeTbd',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Date known but kick-off time not announced (legacy time: "").' },
    },
    { name: 'location', type: 'select', required: true, options: [...TEAM_SIDE_OPTIONS] },
    {
      name: 'opponent',
      type: 'relationship',
      relationTo: 'teams',
      admin: { description: 'Empty for meetings.' },
    },
    {
      name: 'opponentName',
      type: 'text',
      required: true,
      admin: {
        description:
          'Canonical Greek (uppercase) opponent string — or the meeting title. Part of the frozen eventKey; do not rename casually.',
      },
    },
    { name: 'venue', type: 'text' },
    {
      name: 'logoUrl',
      type: 'text',
      admin: {
        description:
          'Legacy opponent-logo path (images/team_logos/*.webp) — served verbatim in the frozen JSON contract.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'upcoming',
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Live', value: 'live' },
        { label: 'Played', value: 'played' },
      ],
    },
    {
      name: 'score',
      type: 'text',
      admin: { description: 'Home-away order, e.g. 2-1 (volleyball: sets, e.g. 3-1).' },
    },
    { name: 'penalties', type: 'text', admin: { description: 'Cup shoot-out, e.g. 1-3.' } },
    {
      name: 'competition',
      type: 'select',
      options: [
        { label: 'League', value: 'league' },
        { label: 'Cup', value: 'cup' },
        { label: 'Friendly', value: 'friendly' },
      ],
    },
    { name: 'matchday', type: 'number' },
    { name: 'duration', type: 'text' },
    { name: 'reportEN', type: 'text' },
    { name: 'reportEL', type: 'text' },
    {
      type: 'collapsible',
      label: 'Match detail (football)',
      fields: [
        {
          name: 'scorers',
          type: 'array',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'minute', type: 'text' },
            teamSideField,
            {
              name: 'type',
              type: 'select',
              options: [
                { label: 'Penalty', value: 'pen' },
                { label: 'Own goal', value: 'og' },
              ],
            },
          ],
        },
        {
          name: 'bookings',
          type: 'array',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'minute', type: 'text' },
            teamSideField,
            {
              name: 'card',
              type: 'select',
              required: true,
              options: [
                { label: 'Yellow', value: 'yellow' },
                { label: 'Red', value: 'red' },
              ],
            },
          ],
        },
        {
          name: 'lineup',
          type: 'group',
          fields: [
            { name: 'home', type: 'array', fields: lineupPlayerFields },
            { name: 'away', type: 'array', fields: lineupPlayerFields },
          ],
        },
        {
          name: 'subs',
          type: 'array',
          fields: [
            { name: 'playerOn', type: 'text', required: true },
            { name: 'playerOff', type: 'text', required: true },
            { name: 'minute', type: 'text' },
            teamSideField,
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Match detail (volleyball)',
      fields: [
        {
          name: 'sets',
          type: 'array',
          admin: { description: 'Per-set rally points, home-away.' },
          fields: [
            { name: 'home', type: 'number', required: true },
            { name: 'away', type: 'number', required: true },
          ],
        },
        {
          name: 'vbScorers',
          type: 'array',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'points', type: 'number', required: true },
            teamSideField,
          ],
        },
      ],
    },
    {
      name: 'eventKey',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'FROZEN legacy key (month-day-sport-opponent) — computed automatically.',
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Scraper', value: 'scraper' },
        { label: 'Manual', value: 'manual' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'locked',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Extra safety for any future automated writer (e.g. the planned MCP tool): locked fixtures must never be touched programmatically.',
      },
    },
  ],
}
