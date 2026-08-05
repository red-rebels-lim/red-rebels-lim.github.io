import type { CollectionConfig } from 'payload'
import { SPORT_OPTIONS } from './shared'

export const Teams: CollectionConfig = {
  slug: 'teams',
  admin: {
    useAsTitle: 'nameEl',
    defaultColumns: ['slug', 'nameEl', 'nameEn', 'sports'],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Stable key, same as i18n fotmob.teams.* (e.g. omonoia).' },
    },
    {
      name: 'nameEl',
      type: 'text',
      required: true,
      admin: {
        description: 'Canonical Greek uppercase — matches legacy events.ts opponent strings.',
      },
    },
    { name: 'nameEn', type: 'text', required: true },
    { name: 'shortName', type: 'text' },
    {
      name: 'aliases',
      type: 'array',
      admin: {
        description: 'Scraper-source spellings (FotMob / DataProject English names, variants).',
      },
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      name: 'sports',
      type: 'select',
      hasMany: true,
      options: SPORT_OPTIONS.filter((o) => o.value !== 'meeting').map((o) => ({ ...o })),
    },
    { name: 'fotmobId', type: 'number' },
    {
      name: 'logoUrl',
      type: 'text',
      admin: { description: 'Legacy crest path (images/team_logos/*.webp).' },
    },
    { name: 'logo', type: 'upload', relationTo: 'team-logos' },
  ],
}
