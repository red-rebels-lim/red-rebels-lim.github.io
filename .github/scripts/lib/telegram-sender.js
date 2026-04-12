/**
 * Send a notification message via Telegram Bot API.
 * @param {number} chatId - Telegram chat ID
 * @param {{ title: string, body: string }} payload - Message content
 * @param {string} botToken - Telegram bot token
 * @returns {Promise<{ ok: boolean, statusCode?: number }>}
 */
export async function sendTelegramMessage(chatId, payload, botToken) {
  const text = `<b>${escapeHtml(payload.title)}</b>\n${escapeHtml(payload.body)}`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });

  if (!res.ok) {
    return { ok: false, statusCode: res.status };
  }
  return { ok: true };
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
