/**
 * Cloudflare Worker entry point.
 * Routes /api/* webhook requests to the appropriate handlers.
 * /events.json and /players.json are served dynamically from D1 (DATA-07),
 * falling back to the static build artifacts on any failure.
 * Everything else is served from static assets.
 */

import { buildEventsFeed, buildPlayersFeed, type D1Database } from './worker/feeds';

interface SecretsStoreBinding {
  get(): Promise<string | null>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface Env {
  TELEGRAM_BOT_TOKEN: SecretsStoreBinding;
  BACK4APP_APP_ID: SecretsStoreBinding;
  BACK4APP_REST_API_KEY: SecretsStoreBinding;
  D1?: D1Database;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

interface ResolvedSecrets {
  telegramToken: string;
  appId: string;
  restApiKey: string;
}

async function resolveSecrets(env: Env): Promise<ResolvedSecrets | null> {
  const [telegramToken, appId, restApiKey] = await Promise.all([
    env.TELEGRAM_BOT_TOKEN?.get(),
    env.BACK4APP_APP_ID?.get(),
    env.BACK4APP_REST_API_KEY?.get(),
  ]);
  if (!telegramToken || !appId || !restApiKey) return null;
  return { telegramToken, appId, restApiKey };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/telegram-webhook' && request.method === 'POST') {
      const secrets = await resolveSecrets(env);
      if (!secrets) return new Response('Missing env vars', { status: 500 });
      return handleTelegramWebhook(request, secrets.telegramToken, secrets.appId, secrets.restApiKey);
    }

    if (request.method === 'GET' && (url.pathname === '/events.json' || url.pathname === '/players.json')) {
      return serveFeed(request, env, ctx, url.pathname);
    }

    return env.ASSETS.fetch(request);
  },
};

// ─── D1-backed feeds (DATA-07) ───────────────────────────────────────────────

// TTL-only caching until DATA-08 adds the meta version row that Payload bumps
// on write; then the cache key can include it for instant invalidation.
const FEED_CACHE_CONTROL = 'public, max-age=60';

async function serveFeed(request: Request, env: Env, ctx: ExecutionContext, pathname: string): Promise<Response> {
  try {
    if (!env.D1) throw new Error('D1 binding missing');
    // Cache API is Workers-specific (caches.default) — absent in tests.
    const cache = (globalThis.caches as unknown as { default?: Cache } | undefined)?.default;
    const cacheKey = new Request(new URL(pathname, request.url).toString());
    if (cache) {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    }
    const feed = pathname === '/events.json' ? await buildEventsFeed(env.D1) : await buildPlayersFeed(env.D1);
    const response = new Response(JSON.stringify(feed), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': FEED_CACHE_CONTROL,
      },
    });
    if (cache) ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    // The static build artifacts keep being generated until DATA-15 exactly so
    // a D1 outage degrades to stale-but-valid data, never an error response.
    console.error(`feed ${pathname} fell back to static assets:`, error);
    return env.ASSETS.fetch(request);
  }
}

// ─── Telegram ────────────────────────────────────────────────────────────────

const TELEGRAM_PARSE_URL = 'https://parseapi.back4app.com/classes/TelegramSubscriber';

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { language_code?: string };
    text?: string;
  };
}

async function handleTelegramWebhook(request: Request, token: string, appId: string, restApiKey: string): Promise<Response> {
  let update: TelegramUpdate;
  try {
    update = await request.json() as TelegramUpdate;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const message = update.message;
  if (!message?.text) return new Response('OK');

  const chatId = message.chat.id;
  const command = message.text.trim().split(/\s+/)[0].toLowerCase();
  const existing = await tgQuery(appId, restApiKey, chatId);
  const userLang = (existing as { lang?: string } | null)?.lang ??
    (message.from?.language_code === 'el' ? 'el' : 'en');
  const msg = TG_MESSAGES[userLang as keyof typeof TG_MESSAGES] ?? TG_MESSAGES.en;

  switch (command) {
    case '/start': {
      if (existing) {
        await tgSend(token, chatId, msg.alreadySubscribed);
      } else {
        const lang = message.from?.language_code === 'el' ? 'el' : 'en';
        await tgCreate(appId, restApiKey, chatId, lang);
        await tgSend(token, chatId, msg.welcome);
      }
      break;
    }
    case '/stop': {
      if (existing) {
        await tgDelete(appId, restApiKey, (existing as { objectId: string }).objectId);
        await tgSend(token, chatId, msg.stopped);
      } else {
        await tgSend(token, chatId, msg.notSubscribed);
      }
      break;
    }
    case '/language': {
      if (existing) {
        const newLang = userLang === 'en' ? 'el' : 'en';
        await tgUpdate(appId, restApiKey, (existing as { objectId: string }).objectId, { lang: newLang });
        const newMsg = TG_MESSAGES[newLang as keyof typeof TG_MESSAGES];
        await tgSend(token, chatId, newMsg.langSwitched);
      } else {
        await tgSend(token, chatId, msg.notSubscribed);
      }
      break;
    }
    case '/help':
    default:
      await tgSend(token, chatId, msg.help);
  }

  return new Response('OK');
}

async function tgQuery(appId: string, restApiKey: string, chatId: number) {
  const res = await fetch(
    `${TELEGRAM_PARSE_URL}?where=${encodeURIComponent(JSON.stringify({ chatId }))}`,
    { headers: parseHeaders(appId, restApiKey) },
  );
  const data = await res.json() as { results: Array<{ objectId: string }> };
  return data.results?.[0] ?? null;
}

async function tgCreate(appId: string, restApiKey: string, chatId: number, lang: string) {
  await fetch(TELEGRAM_PARSE_URL, {
    method: 'POST',
    headers: { ...parseHeaders(appId, restApiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId, lang, active: true,
      reminderHours: [24, 2],
      enabledSports: ['football-men', 'volleyball-men', 'volleyball-women'],
    }),
  });
}

async function tgDelete(appId: string, restApiKey: string, objectId: string) {
  await fetch(`${TELEGRAM_PARSE_URL}/${objectId}`, {
    method: 'DELETE',
    headers: parseHeaders(appId, restApiKey),
  });
}

async function tgUpdate(appId: string, restApiKey: string, objectId: string, fields: Record<string, unknown>) {
  await fetch(`${TELEGRAM_PARSE_URL}/${objectId}`, {
    method: 'PUT',
    headers: { ...parseHeaders(appId, restApiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}

async function tgSend(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

const TG_MESSAGES = {
  en: {
    welcome: '🔴 <b>Red Rebels Calendar Bot</b>\n\nYou will receive match reminders and score updates for Nea Salamina FC.\n\nCommands:\n/stop — Unsubscribe\n/language — Switch language\n/help — Show this message',
    alreadySubscribed: "You're already subscribed! Use /stop to unsubscribe.",
    stopped: 'Unsubscribed. You will no longer receive notifications. Use /start to re-subscribe.',
    notSubscribed: "You're not subscribed. Use /start to subscribe.",
    langSwitched: 'Language switched to English.',
    help: 'Commands:\n/start — Subscribe to notifications\n/stop — Unsubscribe\n/language — Switch language\n/help — Show this message',
  },
  el: {
    welcome: '🔴 <b>Red Rebels Calendar Bot</b>\n\nΘα λαμβάνετε υπενθυμίσεις αγώνων και ενημερώσεις σκορ για τη Νέα Σαλαμίνα.\n\nΕντολές:\n/stop — Κατάργηση εγγραφής\n/language — Αλλαγή γλώσσας\n/help — Εμφάνιση αυτού του μηνύματος',
    alreadySubscribed: 'Είστε ήδη εγγεγραμμένοι! Χρησιμοποιήστε /stop για κατάργηση.',
    stopped: 'Κατάργηση εγγραφής. Δεν θα λαμβάνετε πλέον ειδοποιήσεις. Χρησιμοποιήστε /start για επανεγγραφή.',
    notSubscribed: 'Δεν είστε εγγεγραμμένοι. Χρησιμοποιήστε /start για εγγραφή.',
    langSwitched: 'Η γλώσσα άλλαξε σε Ελληνικά.',
    help: 'Εντολές:\n/start — Εγγραφή σε ειδοποιήσεις\n/stop — Κατάργηση εγγραφής\n/language — Αλλαγή γλώσσας\n/help — Εμφάνιση αυτού του μηνύματος',
  },
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseHeaders(appId: string, restApiKey: string) {
  return {
    'X-Parse-Application-Id': appId,
    'X-Parse-REST-API-Key': restApiKey,
  };
}
