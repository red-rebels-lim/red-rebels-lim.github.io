// DATA-08: every write to a data collection must bump the payload_kv
// 'dataVersion' row the rrcalendar Worker keys its edge cache on.

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'

import { DATA_VERSION_KEY } from '../../src/lib/dataVersion'

let payload: Payload
let teamId: string | number

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  if (teamId) await payload.delete({ collection: 'teams', id: teamId }).catch(() => {})
})

async function version(): Promise<unknown> {
  return payload.kv.get(DATA_VERSION_KEY)
}

describe('data-version bump hooks', () => {
  it('bumps on create', async () => {
    const before = await version()
    const team = await payload.create({
      collection: 'teams',
      data: { slug: 'test-data-version', nameEl: 'ΤΕΣΤ', nameEn: 'Test' },
    })
    teamId = team.id
    const after = await version()
    expect(after).not.toBeNull()
    expect(after).not.toEqual(before)
  })

  it('bumps on update', async () => {
    const before = await version()
    await payload.update({
      collection: 'teams',
      id: teamId,
      data: { shortName: 'TDV' },
    })
    expect(await version()).not.toEqual(before)
  })

  it('bumps on delete', async () => {
    const before = await version()
    await payload.delete({ collection: 'teams', id: teamId })
    expect(await version()).not.toEqual(before)
  })
})
