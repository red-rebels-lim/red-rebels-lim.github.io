// Data-version bump (DATA-08). Every write to a collection that feeds the
// public JSON endpoints bumps one KV row (payload_kv table, same D1, same
// write path — no external calls). The rrcalendar Worker keys its edge cache
// on the value with a ~10s memo, so a dashboard edit becomes visible on
// /events.json + /live.json within seconds instead of a full cache TTL.

import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Payload,
} from 'payload'

export const DATA_VERSION_KEY = 'dataVersion'

// Timestamp + per-isolate counter: no read-modify-write race between
// concurrent saves, and two writes in the same millisecond still produce
// distinct values. The Worker treats it as an opaque token.
let bumpCounter = 0

export async function bumpDataVersion(payload: Payload): Promise<void> {
  const value = `${Date.now()}.${++bumpCounter}`
  // @payloadcms/db-d1-sqlite aliases `upsert` to `updateOne`, so kv.set on a
  // missing key is a silent no-op — the row must be created at the db layer
  // the first time (kv reads/updates work fine once it exists).
  if (await payload.kv.has(DATA_VERSION_KEY)) {
    await payload.kv.set(DATA_VERSION_KEY, value)
  } else {
    try {
      await payload.db.create({
        collection: 'payload-kv',
        data: { key: DATA_VERSION_KEY, data: value },
        req: {} as Parameters<typeof payload.db.create>[0]['req'],
      })
    } catch {
      // Concurrent first bump lost the unique-key race — the row exists now.
      await payload.kv.set(DATA_VERSION_KEY, value)
    }
  }
}

export const bumpDataVersionAfterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await bumpDataVersion(req.payload)
  return doc
}

export const bumpDataVersionAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await bumpDataVersion(req.payload)
  return doc
}

/** Hook block for the data collections the public feeds are derived from. */
export const dataVersionHooks = {
  afterChange: [bumpDataVersionAfterChange],
  afterDelete: [bumpDataVersionAfterDelete],
}
