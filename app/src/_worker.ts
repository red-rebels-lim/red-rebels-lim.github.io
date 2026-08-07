/**
 * Cloudflare Worker entry point.
 * Routes /api/* webhook requests to the appropriate handlers.
 * /events.json and /players.json are served dynamically from D1 (DATA-07),
 * falling back to the static build artifacts on any failure.
 * Everything else is served from static assets.
 */

import {
  buildEventsFeed,
  buildLiveFeed,
  buildPlayersFeed,
  getDataVersion,
  type D1Database,
} from './worker/feeds';
import { handlePushRoute, tgCreate, tgDelete, tgFind, tgSetLang } from './worker/push';

interface SecretsStoreBinding {
  get(): Promise<string | null>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface Env {
  TELEGRAM_BOT_TOKEN: SecretsStoreBinding;
  // Back4App secret bindings still exist in wrangler.jsonc until DATA-15,
  // but nothing in the Worker reads them anymore (DATA-11 moved the stores
  // to D1).
  D1?: D1Database;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/telegram-webhook' && request.method === 'POST') {
      const telegramToken = await env.TELEGRAM_BOT_TOKEN?.get();
      if (!telegramToken || !env.D1) return new Response('Missing env vars', { status: 500 });
      return handleTelegramWebhook(request, telegramToken, env.D1);
    }

    if (url.pathname.startsWith('/api/push/')) {
      if (!env.D1) return new Response('Service unavailable', { status: 503 });
      const limited = await rateLimit(request);
      if (limited) return limited;
      const response = await handlePushRoute(env.D1, request, url.pathname);
      if (response) return response;
    }

    if (request.method === 'GET' && url.pathname in FEEDS) {
      return serveFeed(request, env, ctx, url.pathname as keyof typeof FEEDS);
    }

    return env.ASSETS.fetch(request);
  },
};

// ─── light per-IP rate limit (DATA-11) ───────────────────────────────────────

// Best-effort fixed window via the Cache API: per-colo and racy by design —
// enough to blunt abuse of the unauthenticated push endpoints without a
// Durable Object. 60 requests/hour is generous for register/prefs flows.
const RATE_LIMIT = 60;

async function rateLimit(request: Request): Promise<Response | null> {
  const cache = (globalThis.caches as unknown as { default?: Cache } | undefined)?.default;
  if (!cache) return null; // tests / local without Cache API
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const windowStart = Math.floor(Date.now() / 3_600_000);
  const key = new Request(`https://rate-limit.internal/push/${ip}/${windowStart}`);
  const hit = await cache.match(key);
  const count = hit ? Number(await hit.text()) : 0;
  if (count >= RATE_LIMIT) {
    return new Response(JSON.stringify({ error: 'rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': '3600' },
    });
  }
  await cache.put(key, new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=3600' } }));
  return null;
}

// ─── D1-backed feeds (DATA-07/08) ────────────────────────────────────────────

// Cache keys include the Payload-bumped data version (DATA-08), so a dashboard
// edit is visible within the ~10s version memo; max-age only bounds the edge
// entry's lifetime and client-side caching.
const FEEDS = {
  '/events.json': { build: buildEventsFeed, maxAge: 60 },
  '/players.json': { build: buildPlayersFeed, maxAge: 60 },
  '/live.json': { build: buildLiveFeed, maxAge: 30 },
} as const;

async function serveFeed(request: Request, env: Env, ctx: ExecutionContext, pathname: keyof typeof FEEDS): Promise<Response> {
  const { build, maxAge } = FEEDS[pathname];
  try {
    if (!env.D1) throw new Error('D1 binding missing');
    // Cache API is Workers-specific (caches.default) — absent in tests.
    const cache = (globalThis.caches as unknown as { default?: Cache } | undefined)?.default;
    const version = await getDataVersion(env.D1);
    const cacheKey = new Request(`${new URL(pathname, request.url)}?v=${encodeURIComponent(version)}`);
    if (cache) {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    }
    const feed = await build(env.D1);
    const response = new Response(JSON.stringify(feed), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${maxAge}`,
      },
    });
    if (cache) ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.error(`feed ${pathname} fell back:`, error);
    if (pathname === '/live.json') {
      // No static counterpart exists (the SPA fallthrough would serve HTML) —
      // an empty list is the contract-valid degraded answer.
      return new Response('[]', {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=5' },
      });
    }
    // The static build artifacts keep being generated until DATA-15 exactly so
    // a D1 outage degrades to stale-but-valid data, never an error response.
    return env.ASSETS.fetch(request);
  }
}

// ─── Telegram ────────────────────────────────────────────────────────────────
// Subscriber store lives in D1 (telegram_subscribers, DATA-11); previously
// Back4App REST.

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { language_code?: string };
    text?: string;
  };
}

async function handleTelegramWebhook(request: Request, token: string, d1: D1Database): Promise<Response> {
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
  const existing = await tgFind(d1, chatId);
  const userLang = existing?.lang ??
    (message.from?.language_code === 'el' ? 'el' : 'en');
  const msg = TG_MESSAGES[userLang as keyof typeof TG_MESSAGES] ?? TG_MESSAGES.en;

  switch (command) {
    case '/start': {
      if (existing?.active) {
        await tgSend(token, chatId, msg.alreadySubscribed);
      } else {
        const lang = message.from?.language_code === 'el' ? 'el' : 'en';
        await tgCreate(d1, chatId, lang);
        await tgSend(token, chatId, msg.welcome);
      }
      break;
    }
    case '/stop': {
      if (existing) {
        await tgDelete(d1, chatId);
        await tgSend(token, chatId, msg.stopped);
      } else {
        await tgSend(token, chatId, msg.notSubscribed);
      }
      break;
    }
    case '/language': {
      if (existing) {
        const newLang = userLang === 'en' ? 'el' : 'en';
        await tgSetLang(d1, chatId, newLang);
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

