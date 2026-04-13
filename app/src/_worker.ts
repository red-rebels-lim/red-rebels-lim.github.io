/**
 * Cloudflare Worker entry point.
 * Routes /api/* webhook requests to the appropriate handlers.
 * Everything else is served from static assets.
 */

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  VIBER_BOT_TOKEN: string;
  BACK4APP_APP_ID: string;
  BACK4APP_REST_API_KEY: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/telegram-webhook' && request.method === 'POST') {
      return handleTelegramWebhook(request, env);
    }

    if (url.pathname === '/api/viber-webhook' && request.method === 'POST') {
      return handleViberWebhook(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

// ─── Telegram ────────────────────────────────────────────────────────────────

const TELEGRAM_PARSE_URL = 'https://parseapi.back4app.com/classes/TelegramSubscriber';

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { language_code?: string };
    text?: string;
  };
}

async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.BACK4APP_APP_ID || !env.BACK4APP_REST_API_KEY) {
    return new Response('Missing env vars', { status: 500 });
  }

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
  const existing = await tgQuery(env, chatId);
  const userLang = (existing as { lang?: string } | null)?.lang ??
    (message.from?.language_code === 'el' ? 'el' : 'en');
  const msg = TG_MESSAGES[userLang as keyof typeof TG_MESSAGES] ?? TG_MESSAGES.en;

  switch (command) {
    case '/start': {
      if (existing) {
        await tgSend(env.TELEGRAM_BOT_TOKEN, chatId, msg.alreadySubscribed);
      } else {
        const lang = message.from?.language_code === 'el' ? 'el' : 'en';
        await tgCreate(env, chatId, lang);
        await tgSend(env.TELEGRAM_BOT_TOKEN, chatId, msg.welcome);
      }
      break;
    }
    case '/stop': {
      if (existing) {
        await tgDelete(env, (existing as { objectId: string }).objectId);
        await tgSend(env.TELEGRAM_BOT_TOKEN, chatId, msg.stopped);
      } else {
        await tgSend(env.TELEGRAM_BOT_TOKEN, chatId, msg.notSubscribed);
      }
      break;
    }
    case '/language': {
      if (existing) {
        const newLang = userLang === 'en' ? 'el' : 'en';
        await tgUpdate(env, (existing as { objectId: string }).objectId, { lang: newLang });
        const newMsg = TG_MESSAGES[newLang as keyof typeof TG_MESSAGES];
        await tgSend(env.TELEGRAM_BOT_TOKEN, chatId, newMsg.langSwitched);
      } else {
        await tgSend(env.TELEGRAM_BOT_TOKEN, chatId, msg.notSubscribed);
      }
      break;
    }
    case '/help':
    default:
      await tgSend(env.TELEGRAM_BOT_TOKEN, chatId, msg.help);
  }

  return new Response('OK');
}

async function tgQuery(env: Env, chatId: number) {
  const res = await fetch(
    `${TELEGRAM_PARSE_URL}?where=${encodeURIComponent(JSON.stringify({ chatId }))}`,
    { headers: parseHeaders(env) },
  );
  const data = await res.json() as { results: Array<{ objectId: string }> };
  return data.results?.[0] ?? null;
}

async function tgCreate(env: Env, chatId: number, lang: string) {
  await fetch(TELEGRAM_PARSE_URL, {
    method: 'POST',
    headers: { ...parseHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId, lang, active: true,
      reminderHours: [24, 2],
      enabledSports: ['football-men', 'volleyball-men', 'volleyball-women'],
    }),
  });
}

async function tgDelete(env: Env, objectId: string) {
  await fetch(`${TELEGRAM_PARSE_URL}/${objectId}`, {
    method: 'DELETE',
    headers: parseHeaders(env),
  });
}

async function tgUpdate(env: Env, objectId: string, fields: Record<string, unknown>) {
  await fetch(`${TELEGRAM_PARSE_URL}/${objectId}`, {
    method: 'PUT',
    headers: { ...parseHeaders(env), 'Content-Type': 'application/json' },
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

// ─── Viber ────────────────────────────────────────────────────────────────────

const VIBER_PARSE_URL = 'https://parseapi.back4app.com/classes/ViberSubscriber';

interface ViberEvent {
  event: string;
  user?: { id: string; name?: string; language?: string };
  sender?: { id: string; name?: string; language?: string };
  message?: { text?: string; type?: string };
}

async function handleViberWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.VIBER_BOT_TOKEN || !env.BACK4APP_APP_ID || !env.BACK4APP_REST_API_KEY) {
    return new Response('Missing env vars', { status: 500 });
  }

  let event: ViberEvent;
  try {
    event = await request.json() as ViberEvent;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (event.event === 'webhook') {
    return new Response(JSON.stringify({ status: 0, status_message: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (event.event === 'subscribed' || event.event === 'conversation_started') {
    const user = event.user;
    if (!user?.id) return new Response('OK');
    const existing = await vbQuery(env, user.id);
    if (!existing) {
      const lang = user.language === 'el' ? 'el' : 'en';
      await vbCreate(env, user.id, user.name ?? '', lang);
    }
    const lang = (existing as { lang?: string } | null)?.lang ?? (user.language === 'el' ? 'el' : 'en');
    const msg = VB_MESSAGES[lang as keyof typeof VB_MESSAGES] ?? VB_MESSAGES.en;
    await vbSend(env.VIBER_BOT_TOKEN, user.id, msg.welcome);
    return new Response('OK');
  }

  if (event.event === 'unsubscribed') {
    const userId = event.user?.id;
    if (userId) {
      const existing = await vbQuery(env, userId);
      if (existing) {
        await vbUpdate(env, (existing as { objectId: string }).objectId, { active: false });
      }
    }
    return new Response('OK');
  }

  if (event.event === 'message' && event.message?.text) {
    const senderId = event.sender?.id;
    if (!senderId) return new Response('OK');
    const existing = await vbQuery(env, senderId);
    const userLang = (existing as { lang?: string } | null)?.lang ?? 'en';
    const msg = VB_MESSAGES[userLang as keyof typeof VB_MESSAGES] ?? VB_MESSAGES.en;
    const command = event.message.text.trim().toLowerCase();

    switch (command) {
      case 'start': {
        if (existing) {
          if (!(existing as { active?: boolean }).active) {
            await vbUpdate(env, (existing as { objectId: string }).objectId, { active: true });
            await vbSend(env.VIBER_BOT_TOKEN, senderId, msg.welcome);
          } else {
            await vbSend(env.VIBER_BOT_TOKEN, senderId, msg.alreadySubscribed);
          }
        } else {
          const lang = event.sender?.language === 'el' ? 'el' : 'en';
          await vbCreate(env, senderId, event.sender?.name ?? '', lang);
          await vbSend(env.VIBER_BOT_TOKEN, senderId, msg.welcome);
        }
        break;
      }
      case 'stop': {
        if (existing) {
          await vbUpdate(env, (existing as { objectId: string }).objectId, { active: false });
          await vbSend(env.VIBER_BOT_TOKEN, senderId, msg.stopped);
        }
        break;
      }
      case 'language': {
        if (existing) {
          const newLang = userLang === 'en' ? 'el' : 'en';
          await vbUpdate(env, (existing as { objectId: string }).objectId, { lang: newLang });
          const newMsg = VB_MESSAGES[newLang as keyof typeof VB_MESSAGES];
          await vbSend(env.VIBER_BOT_TOKEN, senderId, newMsg.langSwitched);
        }
        break;
      }
      default:
        await vbSend(env.VIBER_BOT_TOKEN, senderId, msg.help);
    }
  }

  return new Response('OK');
}

async function vbQuery(env: Env, viberId: string) {
  const res = await fetch(
    `${VIBER_PARSE_URL}?where=${encodeURIComponent(JSON.stringify({ viberId }))}`,
    { headers: parseHeaders(env) },
  );
  const data = await res.json() as { results: Array<{ objectId: string }> };
  return data.results?.[0] ?? null;
}

async function vbCreate(env: Env, viberId: string, name: string, lang: string) {
  await fetch(VIBER_PARSE_URL, {
    method: 'POST',
    headers: { ...parseHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      viberId, name, lang, active: true,
      reminderHours: [24, 2],
      enabledSports: ['football-men', 'volleyball-men', 'volleyball-women'],
    }),
  });
}

async function vbUpdate(env: Env, objectId: string, fields: Record<string, unknown>) {
  await fetch(`${VIBER_PARSE_URL}/${objectId}`, {
    method: 'PUT',
    headers: { ...parseHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}

async function vbSend(token: string, receiverId: string, text: string) {
  await fetch('https://chatapi.viber.com/pa/send_message', {
    method: 'POST',
    headers: { 'X-Viber-Auth-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver: receiverId, type: 'text', text, sender: { name: 'Red Rebels' } }),
  });
}

const VB_MESSAGES = {
  en: {
    welcome: '🔴 Red Rebels Calendar Bot\n\nYou will receive match reminders and score updates for Nea Salamina FC.\n\nSend "stop" to unsubscribe\nSend "language" to switch language\nSend "help" for commands',
    alreadySubscribed: 'You\'re already subscribed! Send "stop" to unsubscribe.',
    stopped: 'Unsubscribed. You will no longer receive notifications. Send "start" to re-subscribe.',
    langSwitched: 'Language switched to English.',
    help: 'Commands:\n"start" — Subscribe\n"stop" — Unsubscribe\n"language" — Switch language\n"help" — Show commands',
  },
  el: {
    welcome: '🔴 Red Rebels Calendar Bot\n\nΘα λαμβάνετε υπενθυμίσεις αγώνων και ενημερώσεις σκορ για τη Νέα Σαλαμίνα.\n\nΣτείλτε "stop" για κατάργηση εγγραφής\nΣτείλτε "language" για αλλαγή γλώσσας\nΣτείλτε "help" για εντολές',
    alreadySubscribed: 'Είστε ήδη εγγεγραμμένοι! Στείλτε "stop" για κατάργηση.',
    stopped: 'Κατάργηση εγγραφής. Στείλτε "start" για επανεγγραφή.',
    langSwitched: 'Η γλώσσα άλλαξε σε Ελληνικά.',
    help: 'Εντολές:\n"start" — Εγγραφή\n"stop" — Κατάργηση εγγραφής\n"language" — Αλλαγή γλώσσας\n"help" — Εμφάνιση εντολών',
  },
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseHeaders(env: Env) {
  return {
    'X-Parse-Application-Id': env.BACK4APP_APP_ID,
    'X-Parse-REST-API-Key': env.BACK4APP_REST_API_KEY,
  };
}
