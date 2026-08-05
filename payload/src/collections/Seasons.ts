import type { CollectionConfig } from 'payload'

export const Seasons: CollectionConfig = {
  slug: 'seasons',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'startYear', 'endYear', 'isCurrent'],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'e.g. 2026-27' },
    },
    { name: 'startYear', type: 'number', required: true },
    { name: 'endYear', type: 'number', required: true },
    {
      name: 'isCurrent',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Exactly one season should be current.' },
    },
  ],
}
