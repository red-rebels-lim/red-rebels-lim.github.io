// @vitest-environment node
//
// Runs the push handlers against a REAL local D1 (miniflare via
// getPlatformProxy, throwaway persist dir) with the schema taken from the
// actual migration file — no hand-maintained fake SQL semantics.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy } from 'wrangler';
import {
  handleRegister,
  handleGetPrefs,
  handleUpdatePrefs,
  handleUnregister,
  handlePushRoute,
  tgFind,
  tgCreate,
  tgDelete,
  tgSetLang,
} from '@/worker/push';
import type { D1Database } from '@/worker/feeds';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION = path.resolve(
  __dirname,
  '../../../../payload/src/migrations/20260807_160000_push_tables.ts',
);

let proxy: Awaited<ReturnType<typeof getPlatformProxy>>;
let d1: D1Database;
let persistDir: string;

beforeAll(async () => {
  persistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'push-d1-'));
  proxy = await getPlatformProxy({
    configPath: path.join(__dirname, 'test-wrangler.jsonc'),
    persist: { path: persistDir },
  });
  d1 = (proxy.env as { D1: D1Database }).D1;

  // Apply the real migration DDL — extracted from the migration source so the
  // test schema can never drift from the deployed one.
  const source = fs.readFileSync(MIGRATION, 'utf-8');
  const upBody = source.split('export async function down')[0];
  // Capture up to the first UNESCAPED backtick (identifiers inside use \`).
  const statements = [...upBody.matchAll(/sql`((?:\\`|[^`])*)`/g)].map((m) =>
    m[1].replace(/\\`/g, '`'),
  );
  expect(statements.length).toBeGreaterThanOrEqual(8);
  for (const stmt of statements) {
    await d1.prepare(stmt).all();
  }
}, 30_000);

afterAll(async () => {
  await proxy?.dispose();
  fs.rmSync(persistDir, { recursive: true, force: true });
});

describe('register', () => {
  it('creates a web subscription with default prefs', async () => {
    const res = await handleRegister(d1, {
      endpoint: 'https://push.example.com/sub/1',
      p256dh: 'key1',
      auth: 'auth1',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; preferenceId: string };
    expect(body.id).toBeTruthy();
    expect(body.preferenceId).toBeTruthy();

    const prefs = await handleGetPrefs(d1, body.id);
    expect(await prefs.json()).toEqual({
      notifyNewEvents: true,
      notifyTimeChanges: true,
      notifyScoreUpdates: true,
      reminderHours: [24, 2],
      enabledSports: ['football-men', 'volleyball-men', 'volleyball-women'],
      disabled: false,
    });
  });

  it('re-registering the same endpoint reuses the row (upsert-by-endpoint)', async () => {
    const first = (await (
      await handleRegister(d1, { endpoint: 'https://push.example.com/sub/2', p256dh: 'a', auth: 'b' })
    ).json()) as { id: string };
    const second = (await (
      await handleRegister(d1, { endpoint: 'https://push.example.com/sub/2', p256dh: 'c', auth: 'd' })
    ).json()) as { id: string };
    expect(second.id).toBe(first.id);
  });

  it('fcm: creates, then rotates the token on the same row via id', async () => {
    const created = (await (
      await handleRegister(d1, { platform: 'fcm', token: 'tok-1' })
    ).json()) as { id: string };
    const rotated = (await (
      await handleRegister(d1, { platform: 'fcm', token: 'tok-2', id: created.id })
    ).json()) as { id: string };
    expect(rotated.id).toBe(created.id);
  });

  it('fcm: a stale client id falls back to creating a fresh row', async () => {
    const res = (await (
      await handleRegister(d1, { platform: 'fcm', token: 'tok-3', id: 'gone-row' })
    ).json()) as { id: string };
    expect(res.id).not.toBe('gone-row');
  });

  it('rejects invalid input', async () => {
    expect((await handleRegister(d1, { endpoint: 'http://insecure', p256dh: 'a', auth: 'b' })).status).toBe(400);
    expect((await handleRegister(d1, { platform: 'fcm' })).status).toBe(400);
    expect((await handleRegister(d1, 'nope')).status).toBe(400);
  });
});

describe('prefs', () => {
  it('updates a subset of preference fields', async () => {
    const { id } = (await (
      await handleRegister(d1, { endpoint: 'https://push.example.com/sub/3', p256dh: 'a', auth: 'b' })
    ).json()) as { id: string };

    const res = await handleUpdatePrefs(d1, {
      subscription: id,
      reminderHours: [12, 1],
      disabled: true,
    });
    expect(res.status).toBe(200);

    const prefs = (await (await handleGetPrefs(d1, id)).json()) as Record<string, unknown>;
    expect(prefs.reminderHours).toEqual([12, 1]);
    expect(prefs.disabled).toBe(true);
    expect(prefs.notifyNewEvents).toBe(true); // untouched
  });

  it('validates values against the allowed tiers and sports', async () => {
    expect((await handleUpdatePrefs(d1, { subscription: 'x', reminderHours: [7] })).status).toBe(400);
    expect((await handleUpdatePrefs(d1, { subscription: 'x', enabledSports: ['chess'] })).status).toBe(400);
    expect((await handleUpdatePrefs(d1, { subscription: 'missing', disabled: true })).status).toBe(404);
  });
});

describe('unregister', () => {
  it('deletes the subscription and cascades the prefs', async () => {
    const { id } = (await (
      await handleRegister(d1, { endpoint: 'https://push.example.com/sub/4', p256dh: 'a', auth: 'b' })
    ).json()) as { id: string };
    expect((await handleUnregister(d1, { id })).status).toBe(200);
    expect((await handleGetPrefs(d1, id)).status).toBe(404);
  });
});

describe('telegram store', () => {
  it('subscribe / language toggle / unsubscribe round-trip', async () => {
    await tgCreate(d1, 12345, 'en');
    let sub = await tgFind(d1, 12345);
    expect(sub).toMatchObject({ chatId: 12345, lang: 'en', active: true });

    await tgSetLang(d1, 12345, 'el');
    sub = await tgFind(d1, 12345);
    expect(sub?.lang).toBe('el');

    // Re-/start after stop must reactivate, not crash on the unique chat_id.
    await tgCreate(d1, 12345, 'el');
    expect((await tgFind(d1, 12345))?.active).toBe(true);

    await tgDelete(d1, 12345);
    expect(await tgFind(d1, 12345)).toBeNull();
  });
});

describe('routing', () => {
  it('dispatches by path+method and 400s on invalid JSON', async () => {
    const bad = await handlePushRoute(
      d1,
      new Request('https://x/api/push/register', { method: 'POST', body: '{oops' }),
      '/api/push/register',
    );
    expect(bad?.status).toBe(400);

    const miss = await handlePushRoute(
      d1,
      new Request('https://x/api/push/nope', { method: 'POST', body: '{}' }),
      '/api/push/nope',
    );
    expect(miss).toBeNull();
  });

  it('worker route: register via the full worker fetch handler', async () => {
    const { default: worker } = await import('@/_worker');
    const env = {
      D1: d1,
      TELEGRAM_BOT_TOKEN: { get: async () => 'tok' },
      ASSETS: { fetch: async () => new Response('static') },
    } as never;
    const res = await worker.fetch(
      new Request('https://x/api/push/register', {
        method: 'POST',
        body: JSON.stringify({ endpoint: 'https://push.example.com/sub/5', p256dh: 'a', auth: 'b' }),
      }),
      env,
      { waitUntil: vi.fn() },
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { id: string }).id).toBeTruthy();
  });
});
