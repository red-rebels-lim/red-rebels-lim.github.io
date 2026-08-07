/**
 * D1-backed push notification storage + /api/push/* handlers (DATA-11).
 *
 * Replaces the world-readable Back4App classes with validated Worker
 * endpoints over plain D1 tables (created by the payload migration
 * 20260807_160000_push_tables — the Worker owns them, Payload never sees
 * them). Ids are text: exported rows keep their Parse objectIds so ids that
 * clients already persist keep working; new rows get crypto.randomUUID().
 *
 * These are runtime app-data writes on behalf of users — the explicit
 * exception to the "no script writes to D1" rule (see .tasks/README.md).
 */

import type { D1Database } from './feeds';

const SPORTS = ['football-men', 'volleyball-men', 'volleyball-women'];
const REMINDER_TIERS = [24, 12, 2, 1];
const DEFAULT_PREFS = {
  notifyNewEvents: true,
  notifyTimeChanges: true,
  notifyScoreUpdates: true,
  reminderHours: [24, 2],
  enabledSports: SPORTS,
  disabled: false,
};

type Row = Record<string, unknown>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const badRequest = (message: string) => json({ error: message }, 400);

async function one(d1: D1Database, sql: string, ...binds: unknown[]): Promise<Row | undefined> {
  const { results } = await d1.prepare(sql).bind(...binds).all();
  return results[0];
}

// ─── validation ──────────────────────────────────────────────────────────────

interface RegisterInput {
  platform: 'web' | 'fcm';
  id?: string;
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  token?: string;
}

/** Returns a validated input or an error string. */
export function parseRegisterBody(body: unknown): RegisterInput | string {
  if (typeof body !== 'object' || body === null) return 'body must be a JSON object';
  const b = body as Row;
  const platform = b.platform ?? 'web';
  const str = (v: unknown, max = 512) => typeof v === 'string' && v.length > 0 && v.length <= max;

  if (platform === 'fcm') {
    if (!str(b.token, 4096)) return 'fcm registration requires token';
    return { platform: 'fcm', token: b.token as string, id: str(b.id) ? (b.id as string) : undefined };
  }
  if (platform === 'web') {
    if (!str(b.endpoint, 2048) || !(b.endpoint as string).startsWith('https://')) {
      return 'web registration requires an https endpoint';
    }
    if (!str(b.p256dh) || !str(b.auth)) return 'web registration requires p256dh and auth';
    return {
      platform: 'web',
      endpoint: b.endpoint as string,
      p256dh: b.p256dh as string,
      auth: b.auth as string,
    };
  }
  return 'platform must be web or fcm';
}

export function parsePrefsBody(body: unknown): Partial<typeof DEFAULT_PREFS> | string {
  if (typeof body !== 'object' || body === null) return 'body must be a JSON object';
  const b = body as Row;
  const out: Partial<typeof DEFAULT_PREFS> = {};
  for (const flag of ['notifyNewEvents', 'notifyTimeChanges', 'notifyScoreUpdates', 'disabled'] as const) {
    if (b[flag] !== undefined) {
      if (typeof b[flag] !== 'boolean') return `${flag} must be a boolean`;
      out[flag] = b[flag] as boolean;
    }
  }
  if (b.reminderHours !== undefined) {
    if (!Array.isArray(b.reminderHours) || !b.reminderHours.every((h) => REMINDER_TIERS.includes(h as number))) {
      return `reminderHours must be an array from ${JSON.stringify(REMINDER_TIERS)}`;
    }
    out.reminderHours = b.reminderHours as number[];
  }
  if (b.enabledSports !== undefined) {
    if (!Array.isArray(b.enabledSports) || !b.enabledSports.every((s) => SPORTS.includes(s as string))) {
      return `enabledSports must be an array from ${JSON.stringify(SPORTS)}`;
    }
    out.enabledSports = b.enabledSports as string[];
  }
  return out;
}

// ─── handlers ────────────────────────────────────────────────────────────────

async function ensurePreference(d1: D1Database, subscriptionId: string): Promise<string> {
  const existing = await one(
    d1,
    'SELECT id FROM notif_preferences WHERE subscription_id = ?1 LIMIT 1',
    subscriptionId,
  );
  if (existing) return String(existing.id);
  const id = crypto.randomUUID();
  await d1
    .prepare(
      `INSERT INTO notif_preferences (id, subscription_id, reminder_hours, enabled_sports)
       VALUES (?1, ?2, ?3, ?4)`,
    )
    .bind(id, subscriptionId, JSON.stringify(DEFAULT_PREFS.reminderHours), JSON.stringify(DEFAULT_PREFS.enabledSports))
    .all();
  return id;
}

/** POST /api/push/register — upsert a subscription + default prefs. */
export async function handleRegister(d1: D1Database, body: unknown): Promise<Response> {
  const input = parseRegisterBody(body);
  if (typeof input === 'string') return badRequest(input);

  let id: string | undefined;
  if (input.platform === 'fcm') {
    // Token rotation: update the row the client already knows, else create.
    if (input.id) {
      const existing = await one(d1, 'SELECT id FROM push_subscriptions WHERE id = ?1', input.id);
      if (existing) {
        await d1
          .prepare(`UPDATE push_subscriptions SET token = ?2, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?1`)
          .bind(input.id, input.token)
          .all();
        id = input.id;
      }
    }
    if (!id) {
      id = crypto.randomUUID();
      await d1
        .prepare(`INSERT INTO push_subscriptions (id, platform, token) VALUES (?1, 'fcm', ?2)`)
        .bind(id, input.token)
        .all();
    }
  } else {
    // Web: the endpoint is the identity (mirrors the old upsert-by-endpoint).
    const existing = await one(d1, 'SELECT id FROM push_subscriptions WHERE endpoint = ?1', input.endpoint);
    if (existing) {
      id = String(existing.id);
      await d1
        .prepare(`UPDATE push_subscriptions SET p256dh = ?2, auth = ?3, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?1`)
        .bind(id, input.p256dh, input.auth)
        .all();
    } else {
      id = crypto.randomUUID();
      await d1
        .prepare(`INSERT INTO push_subscriptions (id, platform, endpoint, p256dh, auth) VALUES (?1, 'web', ?2, ?3, ?4)`)
        .bind(id, input.endpoint, input.p256dh, input.auth)
        .all();
    }
  }

  const preferenceId = await ensurePreference(d1, id);
  return json({ id, preferenceId });
}

/** GET /api/push/prefs?subscription=<id> */
export async function handleGetPrefs(d1: D1Database, subscriptionId: string | null): Promise<Response> {
  if (!subscriptionId) return badRequest('subscription query parameter required');
  const row = await one(
    d1,
    'SELECT * FROM notif_preferences WHERE subscription_id = ?1 LIMIT 1',
    subscriptionId,
  );
  if (!row) return json({ error: 'not found' }, 404);
  return json({
    notifyNewEvents: !!row.notify_new_events,
    notifyTimeChanges: !!row.notify_time_changes,
    notifyScoreUpdates: !!row.notify_score_updates,
    reminderHours: JSON.parse(String(row.reminder_hours)),
    enabledSports: JSON.parse(String(row.enabled_sports)),
    disabled: !!row.disabled,
  });
}

/** PUT /api/push/prefs — body: { subscription: <id>, ...partial prefs } */
export async function handleUpdatePrefs(d1: D1Database, body: unknown): Promise<Response> {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Row;
  const subscriptionId = typeof b.subscription === 'string' ? b.subscription : null;
  if (!subscriptionId) return badRequest('subscription id required');
  const prefs = parsePrefsBody(body);
  if (typeof prefs === 'string') return badRequest(prefs);

  const sets: string[] = [];
  const binds: unknown[] = [subscriptionId];
  const add = (column: string, value: unknown) => {
    binds.push(value);
    sets.push(`${column} = ?${binds.length}`);
  };
  if (prefs.notifyNewEvents !== undefined) add('notify_new_events', prefs.notifyNewEvents ? 1 : 0);
  if (prefs.notifyTimeChanges !== undefined) add('notify_time_changes', prefs.notifyTimeChanges ? 1 : 0);
  if (prefs.notifyScoreUpdates !== undefined) add('notify_score_updates', prefs.notifyScoreUpdates ? 1 : 0);
  if (prefs.disabled !== undefined) add('disabled', prefs.disabled ? 1 : 0);
  if (prefs.reminderHours !== undefined) add('reminder_hours', JSON.stringify(prefs.reminderHours));
  if (prefs.enabledSports !== undefined) add('enabled_sports', JSON.stringify(prefs.enabledSports));
  if (sets.length === 0) return badRequest('no preference fields provided');

  const existing = await one(d1, 'SELECT id FROM notif_preferences WHERE subscription_id = ?1 LIMIT 1', subscriptionId);
  if (!existing) return json({ error: 'not found' }, 404);

  await d1
    .prepare(
      `UPDATE notif_preferences SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE subscription_id = ?1`,
    )
    .bind(...binds)
    .all();
  return json({ ok: true });
}

/** DELETE /api/push/unregister — body: { id: <subscription id> } */
export async function handleUnregister(d1: D1Database, body: unknown): Promise<Response> {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Row;
  if (typeof b.id !== 'string' || !b.id) return badRequest('id required');
  // notif_preferences rows cascade via the FK.
  await d1.prepare('DELETE FROM push_subscriptions WHERE id = ?1').bind(b.id).all();
  return json({ ok: true });
}

// ─── telegram store (used by the webhook in _worker.ts) ─────────────────────

export interface TelegramSubscriber {
  id: string;
  chatId: number;
  lang: string;
  active: boolean;
}

export async function tgFind(d1: D1Database, chatId: number): Promise<TelegramSubscriber | null> {
  const row = await one(d1, 'SELECT * FROM telegram_subscribers WHERE chat_id = ?1', chatId);
  if (!row) return null;
  return { id: String(row.id), chatId: Number(row.chat_id), lang: String(row.lang), active: !!row.active };
}

export async function tgCreate(d1: D1Database, chatId: number, lang: string): Promise<void> {
  await d1
    .prepare(
      `INSERT INTO telegram_subscribers (id, chat_id, lang) VALUES (?1, ?2, ?3)
       ON CONFLICT(chat_id) DO UPDATE SET active = 1, lang = excluded.lang, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    )
    .bind(crypto.randomUUID(), chatId, lang)
    .all();
}

export async function tgDelete(d1: D1Database, chatId: number): Promise<void> {
  await d1.prepare('DELETE FROM telegram_subscribers WHERE chat_id = ?1').bind(chatId).all();
}

export async function tgSetLang(d1: D1Database, chatId: number, lang: string): Promise<void> {
  await d1
    .prepare(
      `UPDATE telegram_subscribers SET lang = ?2, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE chat_id = ?1`,
    )
    .bind(chatId, lang)
    .all();
}

// ─── routing ─────────────────────────────────────────────────────────────────

/** Route an /api/push/* request. Returns null when the route doesn't match. */
export async function handlePushRoute(d1: D1Database, request: Request, pathname: string): Promise<Response | null> {
  const readBody = async (): Promise<unknown | Response> => {
    try {
      return await request.json();
    } catch {
      return badRequest('invalid JSON body');
    }
  };

  if (pathname === '/api/push/register' && request.method === 'POST') {
    const body = await readBody();
    return body instanceof Response ? body : handleRegister(d1, body);
  }
  if (pathname === '/api/push/prefs' && request.method === 'GET') {
    return handleGetPrefs(d1, new URL(request.url).searchParams.get('subscription'));
  }
  if (pathname === '/api/push/prefs' && request.method === 'PUT') {
    const body = await readBody();
    return body instanceof Response ? body : handleUpdatePrefs(d1, body);
  }
  if (pathname === '/api/push/unregister' && request.method === 'DELETE') {
    const body = await readBody();
    return body instanceof Response ? body : handleUnregister(d1, body);
  }
  return null;
}
