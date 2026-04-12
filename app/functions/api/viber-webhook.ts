/**
 * Cloudflare Pages Function: Viber Bot Webhook
 * Handles subscribed, unsubscribed, conversation_started, and message events.
 * Stores subscribers in Back4App Parse.
 */

interface Env {
  VIBER_BOT_TOKEN: string;
  BACK4APP_APP_ID: string;
  BACK4APP_REST_API_KEY: string;
}

interface ViberEvent {
  event: string;
  user?: { id: string; name?: string; language?: string };
  sender?: { id: string; name?: string; language?: string };
  message?: { text?: string; type?: string };
}

const PARSE_URL = 'https://parseapi.back4app.com/classes/ViberSubscriber';

async function parseQuery(env: Env, viberId: string) {
  const res = await fetch(`${PARSE_URL}?where=${encodeURIComponent(JSON.stringify({ viberId }))}`, {
    headers: {
      'X-Parse-Application-Id': env.BACK4APP_APP_ID,
      'X-Parse-REST-API-Key': env.BACK4APP_REST_API_KEY,
    },
  });
  const data = await res.json() as { results: Array<{ objectId: string }> };
  return data.results?.[0] ?? null;
}

async function parseCreate(env: Env, viberId: string, name: string, lang: string) {
  await fetch(PARSE_URL, {
    method: 'POST',
    headers: {
      'X-Parse-Application-Id': env.BACK4APP_APP_ID,
      'X-Parse-REST-API-Key': env.BACK4APP_REST_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      viberId,
      name,
      lang,
      active: true,
      reminderHours: [24, 2],
      enabledSports: ['football-men', 'volleyball-men', 'volleyball-women'],
    }),
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

async function sendViberMessage(token: string, receiverId: string, text: string) {
  await fetch('https://chatapi.viber.com/pa/send_message', {
    method: 'POST',
    headers: {
      'X-Viber-Auth-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver: receiverId,
      type: 'text',
      text,
      sender: { name: 'Red Rebels' },
    }),
  });
}

const MESSAGES = {
  en: {
    welcome: '🔴 Red Rebels Calendar Bot\n\nYou will receive match reminders and score updates for Nea Salamina FC.\n\nSend "stop" to unsubscribe\nSend "language" to switch language\nSend "help" for commands',
    alreadySubscribed: "You're already subscribed! Send \"stop\" to unsubscribe.",
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (!env.VIBER_BOT_TOKEN || !env.BACK4APP_APP_ID || !env.BACK4APP_REST_API_KEY) {
    return new Response('Missing env vars', { status: 500 });
  }

  let event: ViberEvent;
  try {
    event = await context.request.json() as ViberEvent;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Viber sends a webhook verification request on setup
  if (event.event === 'webhook') {
    return new Response(JSON.stringify({ status: 0, status_message: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (event.event === 'subscribed' || event.event === 'conversation_started') {
    const user = event.user;
    if (!user?.id) return new Response('OK');

    const existing = await parseQuery(env, user.id);
    if (!existing) {
      const lang = user.language === 'el' ? 'el' : 'en';
      await parseCreate(env, user.id, user.name ?? '', lang);
    }

    const lang = (existing as { lang?: string } | null)?.lang ?? (user.language === 'el' ? 'el' : 'en');
    const msg = MESSAGES[lang as keyof typeof MESSAGES] ?? MESSAGES.en;
    await sendViberMessage(env.VIBER_BOT_TOKEN, user.id, msg.welcome);
    return new Response('OK');
  }

  if (event.event === 'unsubscribed') {
    const userId = event.user?.id;
    if (userId) {
      const existing = await parseQuery(env, userId);
      if (existing) {
        await parseUpdate(env, (existing as { objectId: string }).objectId, { active: false });
      }
    }
    return new Response('OK');
  }

  if (event.event === 'message' && event.message?.text) {
    const senderId = event.sender?.id;
    if (!senderId) return new Response('OK');

    const existing = await parseQuery(env, senderId);
    const userLang = (existing as { lang?: string } | null)?.lang ?? 'en';
    const msg = MESSAGES[userLang as keyof typeof MESSAGES] ?? MESSAGES.en;
    const command = event.message.text.trim().toLowerCase();

    switch (command) {
      case 'start': {
        if (existing) {
          if (!(existing as { active?: boolean }).active) {
            await parseUpdate(env, (existing as { objectId: string }).objectId, { active: true });
            await sendViberMessage(env.VIBER_BOT_TOKEN, senderId, msg.welcome);
          } else {
            await sendViberMessage(env.VIBER_BOT_TOKEN, senderId, msg.alreadySubscribed);
          }
        } else {
          const lang = event.sender?.language === 'el' ? 'el' : 'en';
          await parseCreate(env, senderId, event.sender?.name ?? '', lang);
          await sendViberMessage(env.VIBER_BOT_TOKEN, senderId, msg.welcome);
        }
        break;
      }
      case 'stop': {
        if (existing) {
          await parseUpdate(env, (existing as { objectId: string }).objectId, { active: false });
          await sendViberMessage(env.VIBER_BOT_TOKEN, senderId, msg.stopped);
        }
        break;
      }
      case 'language': {
        if (existing) {
          const newLang = userLang === 'en' ? 'el' : 'en';
          await parseUpdate(env, (existing as { objectId: string }).objectId, { lang: newLang });
          const newMsg = MESSAGES[newLang as keyof typeof MESSAGES];
          await sendViberMessage(env.VIBER_BOT_TOKEN, senderId, newMsg.langSwitched);
        }
        break;
      }
      case 'help':
      default:
        await sendViberMessage(env.VIBER_BOT_TOKEN, senderId, msg.help);
        break;
    }
  }

  return new Response('OK');
};
