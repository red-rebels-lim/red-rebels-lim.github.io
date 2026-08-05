import type { CollectionConfig } from 'payload'

export const TeamLogos: CollectionConfig = {
  slug: 'team-logos',
  admin: { description: 'Team crest images (R2).' },
  fields: [{ name: 'alt', type: 'text' }],
  upload: {
    // Not supported on Workers (no sharp)
    crop: false,
    focalPoint: false,
    mimeTypes: ['image/*'],
  },
}
