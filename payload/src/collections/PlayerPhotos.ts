import type { CollectionConfig } from 'payload'

export const PlayerPhotos: CollectionConfig = {
  slug: 'player-photos',
  admin: { description: 'Player portrait images (R2).' },
  fields: [{ name: 'alt', type: 'text' }],
  upload: {
    // Not supported on Workers (no sharp)
    crop: false,
    focalPoint: false,
    mimeTypes: ['image/*'],
  },
}
