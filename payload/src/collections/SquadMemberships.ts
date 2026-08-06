import type { CollectionConfig } from 'payload'
import { dataVersionHooks } from '../lib/dataVersion'
import { SPORT_OPTIONS } from './shared'

export const SquadMemberships: CollectionConfig = {
  slug: 'squad-memberships',
  admin: {
    defaultColumns: ['player', 'season', 'sport', 'shirtNumber', 'active'],
    description: 'Who was in which squad, in which season, with what number.',
  },
  hooks: dataVersionHooks,
  fields: [
    { name: 'player', type: 'relationship', relationTo: 'players', required: true, index: true },
    { name: 'season', type: 'relationship', relationTo: 'seasons', required: true, index: true },
    {
      name: 'sport',
      type: 'select',
      required: true,
      options: SPORT_OPTIONS.filter((o) => o.value !== 'meeting').map((o) => ({ ...o })),
    },
    { name: 'shirtNumber', type: 'number' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'joinedDate', type: 'date' },
    { name: 'leftDate', type: 'date' },
  ],
}
