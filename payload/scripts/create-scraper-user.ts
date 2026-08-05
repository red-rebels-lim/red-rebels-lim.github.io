// Creates (or reads) the scraper service account and writes its API key to the
// file given by SCRAPER_KEY_OUT. Run with the SAME PAYLOAD_SECRET as the
// deployed worker (API keys are encrypted with it):
//   NODE_ENV=production SCRAPER_KEY_OUT=/path/key npx payload run scripts/create-scraper-user.ts
// The key is never printed to stdout — pipe the out-file into
// `gh secret set PAYLOAD_API_KEY` and delete it.

import fs from 'fs'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@payload-config'

const EMAIL = 'scraper@solosalamina.com'

const outFile = process.env.SCRAPER_KEY_OUT
if (!outFile) throw new Error('SCRAPER_KEY_OUT is required')

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: EMAIL } },
  showHiddenFields: true,
})

let apiKey: string | null | undefined
if (existing.docs.length > 0) {
  apiKey = (existing.docs[0] as { apiKey?: string | null }).apiKey
  payload.logger.info(`Scraper user already exists (${EMAIL})`)
} else {
  const created = await payload.create({
    collection: 'users',
    data: {
      email: EMAIL,
      // random password, never used — auth happens via API key only
      password: crypto.randomBytes(32).toString('hex'),
      enableAPIKey: true,
      apiKey: crypto.randomUUID(),
    },
    showHiddenFields: true,
  })
  apiKey = (created as { apiKey?: string | null }).apiKey
  payload.logger.info(`Scraper user created (${EMAIL})`)
}

if (!apiKey) throw new Error('No apiKey on scraper user — is enableAPIKey set?')
fs.writeFileSync(outFile, apiKey, { mode: 0o600 })
payload.logger.info(`API key written to ${outFile}`)
process.exit(0)
