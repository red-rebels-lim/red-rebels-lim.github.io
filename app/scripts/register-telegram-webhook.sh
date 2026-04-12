#!/bin/bash
# One-time setup: Register Telegram webhook
# Usage: TELEGRAM_BOT_TOKEN=your_token ./register-telegram-webhook.sh

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN is required"
  exit 1
fi

WEBHOOK_URL="https://red-rebels.com/api/telegram-webhook"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}" | jq .
