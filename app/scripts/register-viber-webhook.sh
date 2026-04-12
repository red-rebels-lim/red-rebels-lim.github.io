#!/bin/bash
# One-time setup: Register Viber webhook
# Usage: VIBER_BOT_TOKEN=your_token ./register-viber-webhook.sh

if [ -z "$VIBER_BOT_TOKEN" ]; then
  echo "Error: VIBER_BOT_TOKEN is required"
  exit 1
fi

WEBHOOK_URL="https://red-rebels.com/api/viber-webhook"

curl -s -X POST "https://chatapi.viber.com/pa/set_webhook" \
  -H "X-Viber-Auth-Token: ${VIBER_BOT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"event_types\": [\"subscribed\", \"unsubscribed\", \"conversation_started\", \"message\"]}" | jq .
