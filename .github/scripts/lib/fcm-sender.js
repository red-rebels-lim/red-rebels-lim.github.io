/**
 * Send push notifications via Firebase Cloud Messaging (HTTP v1).
 *
 * Optional channel: enabled only when FIREBASE_SERVICE_ACCOUNT is set to the
 * raw Firebase service-account JSON. Mints an OAuth2 access token via
 * google-auth-library (scope: firebase.messaging) and POSTs to the FCM v1
 * messages:send endpoint of the project named in the service account.
 */

import { GoogleAuth } from 'google-auth-library';

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

// Cache the auth client per service-account string so repeated sends in one
// run reuse the minted token (google-auth-library caches internally).
let cached = null; // { raw, auth, projectId }

/** True when the FCM channel is configured. */
export function isFcmConfigured(env = process.env) {
  return Boolean(env.FIREBASE_SERVICE_ACCOUNT);
}

function getContext() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  if (cached && cached.raw === raw) return cached;
  const credentials = JSON.parse(raw);
  cached = {
    raw,
    projectId: credentials.project_id,
    auth: new GoogleAuth({ credentials, scopes: [FCM_SCOPE] }),
  };
  return cached;
}

/**
 * Send a single FCM message to a device token.
 * @param {string} token - FCM device registration token
 * @param {{ title: string, body: string, data?: Record<string, unknown> }} payload
 * @returns {Promise<{ ok: boolean, unregistered: boolean, statusCode?: number }>}
 *   `unregistered` is true when the token is dead (404/UNREGISTERED or
 *   400/INVALID_ARGUMENT) and the subscription should be cleaned up.
 */
export async function sendFcmMessage(token, { title, body, data }) {
  const ctx = getContext();
  if (!ctx) return { ok: false, unregistered: false };

  const accessToken = await ctx.auth.getAccessToken();

  const message = {
    token,
    notification: { title, body },
    android: { priority: 'high' },
  };
  if (data) {
    // FCM v1 requires data values to be strings.
    message.data = Object.fromEntries(
      Object.entries(data)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    );
  }

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${ctx.projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    }
  );

  if (res.ok) return { ok: true, unregistered: false };

  let errorStatus = '';
  try {
    const json = await res.json();
    errorStatus = json?.error?.status || '';
  } catch {
    // non-JSON error body — fall back to HTTP status alone
  }

  const unregistered =
    res.status === 404 ||
    errorStatus === 'UNREGISTERED' ||
    (res.status === 400 && errorStatus === 'INVALID_ARGUMENT');

  return { ok: false, unregistered, statusCode: res.status };
}
