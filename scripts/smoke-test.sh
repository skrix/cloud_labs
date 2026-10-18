#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
API="$BASE_URL/api"
RUN_ID="$(date +%s)-$RANDOM"
PASSWORD='smoke-test-password'
ADMIN_EMAIL="smoke-admin-$RUN_ID@example.com"
USER_EMAIL="smoke-user-$RUN_ID@example.com"

RESPONSE=''
TOKEN=''

call() {
  local expected="$1" method="$2" path="$3"
  shift 3
  local output status
  output="$(curl -sS -X "$method" -H 'Content-Type: application/json' -w '\n%{http_code}' "$@" "$API$path")"
  status="${output##*$'\n'}"
  RESPONSE="${output%$'\n'*}"

  if [ "$status" != "$expected" ]; then
    echo "FAIL $method $path: expected $expected, got $status: $RESPONSE"
    exit 1
  fi
  echo "ok   $status $method $path"
}

signin() {
  call 200 POST /auth/signin -d "{\"email\":\"$1\",\"password\":\"$PASSWORD\"}"
  TOKEN="$(echo "$RESPONSE" | jq -r .token)"
}

promote_to_admin() {
  node -e "
    const { sequelize } = require('./src/db');
    sequelize
      .query('UPDATE \"Users\" SET role = \\'admin\\' WHERE email = :email', {
        replacements: { email: process.argv[1] },
        logging: false,
      })
      .then(() => sequelize.close());
  " "$1"
}

cd "$(dirname "$0")/.."

echo '--- health'
call 200 GET /health
call 200 GET /health/db

echo '--- auth'
call 201 POST /auth/signup -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}"
call 201 POST /auth/signup -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$PASSWORD\"}"
promote_to_admin "$ADMIN_EMAIL"
signin "$ADMIN_EMAIL"
ADMIN_AUTH="Authorization: Bearer $TOKEN"
signin "$USER_EMAIL"
USER_AUTH="Authorization: Bearer $TOKEN"
call 401 GET /devices

echo '--- devices'
call 403 POST /devices -H "$USER_AUTH" -d '{"name":"forbidden"}'
call 201 POST /devices -H "$ADMIN_AUTH" -d "{\"name\":\"ESP32 smoke $RUN_ID\",\"chip\":\"ESP32-WROOM-32\"}"
DEVICE_ID="$(echo "$RESPONSE" | jq -r .id)"
call 200 GET /devices -H "$USER_AUTH"
call 200 GET "/devices/$DEVICE_ID" -H "$USER_AUTH"
call 200 PATCH "/devices/$DEVICE_ID" -H "$ADMIN_AUTH" -d '{"description":"Smoke test board"}'

echo '--- firmwares'
call 201 POST /firmwares -H "$ADMIN_AUTH" -d "{\"deviceId\":\"$DEVICE_ID\",\"version\":\"1.0.0\"}"
FIRMWARE_ID="$(echo "$RESPONSE" | jq -r .id)"
call 200 GET "/firmwares?deviceId=$DEVICE_ID" -H "$USER_AUTH"
call 200 GET "/firmwares/$FIRMWARE_ID" -H "$USER_AUTH"
call 200 PATCH "/firmwares/$FIRMWARE_ID" -H "$ADMIN_AUTH" -d '{"releaseNotes":"First release"}'

echo '--- user devices'
call 201 POST /user-devices -H "$USER_AUTH" \
  -d "{\"name\":\"Kitchen sensor\",\"deviceId\":\"$DEVICE_ID\",\"firmwareId\":\"$FIRMWARE_ID\"}"
USER_DEVICE_ID="$(echo "$RESPONSE" | jq -r .userDevice.id)"
API_KEY="$(echo "$RESPONSE" | jq -r .apiKey)"
call 200 GET /user-devices -H "$USER_AUTH"
call 200 GET "/user-devices/$USER_DEVICE_ID" -H "$USER_AUTH"
call 404 GET "/user-devices/$USER_DEVICE_ID" -H "$ADMIN_AUTH"
call 200 PATCH "/user-devices/$USER_DEVICE_ID" -H "$USER_AUTH" -d '{"name":"Living room sensor"}'

echo '--- readings'
call 401 POST /ingest -H 'X-Device-Key: wrong' -d '{"temperature":21.5}'
call 201 POST /ingest -H "X-Device-Key: $API_KEY" -d '{"temperature":21.5,"humidity":40}'
call 200 GET "/user-devices/$USER_DEVICE_ID/readings?limit=10" -H "$USER_AUTH"
call 200 POST "/user-devices/$USER_DEVICE_ID/rotate-key" -H "$USER_AUTH"
NEW_API_KEY="$(echo "$RESPONSE" | jq -r .apiKey)"
call 401 POST /ingest -H "X-Device-Key: $API_KEY" -d '{"temperature":22}'
call 201 POST /ingest -H "X-Device-Key: $NEW_API_KEY" -d '{"temperature":22}'

echo '--- cleanup'
call 409 DELETE "/devices/$DEVICE_ID" -H "$ADMIN_AUTH"
call 204 DELETE "/user-devices/$USER_DEVICE_ID" -H "$USER_AUTH"
call 204 DELETE "/firmwares/$FIRMWARE_ID" -H "$ADMIN_AUTH"
call 204 DELETE "/devices/$DEVICE_ID" -H "$ADMIN_AUTH"

echo '--- other'
call 404 GET /no-such-route
docs_status="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/docs/")"
if [ "$docs_status" != 200 ]; then
  echo "FAIL GET /docs/: got $docs_status"
  exit 1
fi
echo "ok   200 GET /docs/"

echo 'Smoke test passed'
