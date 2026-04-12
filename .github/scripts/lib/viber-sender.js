/**
 * Send a notification message via Viber Bot API.
 * @param {string} viberId - Viber user ID
 * @param {{ title: string, body: string }} payload - Message content
 * @param {string} botToken - Viber bot auth token
 * @returns {Promise<{ ok: boolean, statusCode?: number }>}
 */
export async function sendViberMessage(viberId, payload, botToken) {
  const text = `${payload.title}\n${payload.body}`;

  const res = await fetch('https://chatapi.viber.com/pa/send_message', {
    method: 'POST',
    headers: {
      'X-Viber-Auth-Token': botToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver: viberId,
      type: 'text',
      text,
      sender: { name: 'Red Rebels' },
    }),
  });

  if (!res.ok) {
    return { ok: false, statusCode: res.status };
  }

  const data = await res.json();
  if (data.status !== 0) {
    return { ok: false, statusCode: data.status };
  }
  return { ok: true };
}
