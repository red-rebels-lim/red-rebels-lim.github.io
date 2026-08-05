import type { CollectionConfig } from 'payload'
import { POSITION_OPTIONS, SPORT_OPTIONS, SUB_POSITION_OPTIONS } from './shared'

export const Players: CollectionConfig = {
  slug: 'players',
  admin: {
    useAsTitle: 'nameEn',
    defaultColumns: ['slug', 'nameEn', 'sport', 'position'],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Stable key from the legacy roster, e.g. alberto_varo_lara.' },
    },
    {
      name: 'sport',
      type: 'select',
      required: true,
      options: SPORT_OPTIONS.filter((o) => o.value !== 'meeting').map((o) => ({ ...o })),
    },
    { name: 'nameEl', type: 'text', required: true },
    { name: 'nameEn', type: 'text', required: true },
    { name: 'position', type: 'select', required: true, options: [...POSITION_OPTIONS] },
    { name: 'subPosition', type: 'select', options: [...SUB_POSITION_OPTIONS] },
    { name: 'dateOfBirth', type: 'date' },
    { name: 'nationality', type: 'text' },
    {
      name: 'aliases',
      type: 'array',
      admin: {
        description:
          'Every raw name form seen in match detail (Greek uppercase, mixed case, abbreviated). Load-bearing for stats resolution.',
      },
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    { name: 'photo', type: 'upload', relationTo: 'player-photos' },
  ],
}
