/**
 * Cloudflare Pages Function: Telegram Bot Webhook
 * Handles /start, /stop, /help, /language commands.
 * Stores subscribers in Back4App Parse.
 */

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  BACK4APP_APP_ID: string;
  BACK4APP_REST_API_KEY: string;
}

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { language_code?: string };
    text?: string;
  };
}

const PARSE_URL = 'https://parseapi.back4app.com/classes/TelegramSubscriber';

async function parseQuery(env: Env, chatId: number) {
  const res = await fetch(`${PARSE_URL}?where=${encodeURIComponent(JSON.stringify({ chatId }))}`, {
    headers: {
      'X-Parse-Application-Id': env.BACK4APP_APP_ID,
      'X-Parse-REST-API-Key': env.BACK4APP_REST_API_KEY,
    },
  });
  const data = await res.json() as { results: Array<{ objectId: string }> };
  return data.results?.[0] ?? null;
}

async function parseCreate(env: Env, chatId: number, lang: string) {
  await fetch(PARSE_URL, {
    method: 'POST',
    headers: {
      'X-Parse-Application-Id': env.BACK4APP_APP_ID,
      'X-Parse-REST-API-Key': env.BACK4APP_REST_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatId,
      lang,
      active: true,
      reminderHours: [24, 2],
      enabledSports: ['football-men', 'volleyball-men', 'volleyball-women'],
    }),
  });
}

async function parseDelete(env: Env, objectId: string) {
  await fetch(`${PARSE_URL}/${objectId}`, {
    method: 'DELETE',
    headers: {
      'X-Parse-Application-Id': env.BACK4APP_APP_ID,
      'X-Parse-REST-API-Key': env.BACK4APP_REST_API_KEY,
    },
  });
}

async function parseUpdate(env: Env, objectId: string, fields: Record<string, unknown>) {
  await fetch(`${PARSE_URL}/${objectId}`, {
    method: 'PUT',
    headers: {
      'X-Parse-Application-Id': env.BACK4APP_APP_ID,
      'X-Parse-REST-API-Key': env.BACK4APP_REST_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fields),
  });
}

async function sendMessage(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

const MESSAGES = {
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (!env.TELEGRAM_BOT_TOKEN || !env.BACK4APP_APP_ID || !env.BACK4APP_REST_API_KEY) {
    return new Response('Missing env vars', { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = await context.request.json() as TelegramUpdate;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const message = update.message;
  if (!message?.text) return new Response('OK');

  const chatId = message.chat.id;
  const command = message.text.trim().split(/\s+/)[0].toLowerCase();
  const existing = await parseQuery(env, chatId);
  const userLang = (existing as { lang?: string } | null)?.lang ??
    (message.from?.language_code === 'el' ? 'el' : 'en');
  const msg = MESSAGES[userLang as keyof typeof MESSAGES] ?? MESSAGES.en;

  switch (command) {
    case '/start': {
      if (existing) {
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg.alreadySubscribed);
      } else {
        const lang = message.from?.language_code === 'el' ? 'el' : 'en';
        await parseCreate(env, chatId, lang);
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg.welcome);
      }
      break;
    }
    case '/stop': {
      if (existing) {
        await parseDelete(env, (existing as { objectId: string }).objectId);
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg.stopped);
      } else {
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg.notSubscribed);
      }
      break;
    }
    case '/language': {
      if (existing) {
        const newLang = userLang === 'en' ? 'el' : 'en';
        await parseUpdate(env, (existing as { objectId: string }).objectId, { lang: newLang });
        const newMsg = MESSAGES[newLang as keyof typeof MESSAGES];
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, newMsg.langSwitched);
      } else {
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg.notSubscribed);
      }
      break;
    }
    case '/help':
    default:
      await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg.help);
      break;
  }

  return new Response('OK');
};
