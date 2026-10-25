#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="${SMOKE_EMAIL:-smoke.lessons@example.com}"
PASSWORD="${SMOKE_PASSWORD:-smoke-pass-123}"
NAME="${SMOKE_NAME:-Lesson Smoke}"
TMP_DIR="$(mktemp -d)"
RESPONSE_FILE="$TMP_DIR/response.json"
TOKEN=""

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local auth_args=()
  local status

  if [[ -n "$TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer $TOKEN")
  fi

  if [[ -n "$body" ]]; then
    status="$(
      curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
        -X "$method" "$BASE_URL$path" \
        -H 'Content-Type: application/json' \
        "${auth_args[@]}" \
        -d "$body"
    )"
  else
    status="$(
      curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
        -X "$method" "$BASE_URL$path" \
        "${auth_args[@]}"
    )"
  fi

  printf '%s' "$status"
}

expect_status() {
  local actual="$1"
  local expected="$2"
  local label="$3"

  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL: $label returned HTTP $actual (expected $expected)" >&2
    jq . "$RESPONSE_FILE" >&2 || cat "$RESPONSE_FILE" >&2
    exit 1
  fi
}

login() {
  local body
  body="$(jq -nc --arg email "$EMAIL" --arg password "$PASSWORD" \
    '{email: $email, password: $password}')"

  api POST /auth/login "$body" >/dev/null
  TOKEN="$(jq -r '.token // empty' "$RESPONSE_FILE")"
}

status="$(api POST /auth/login "$(jq -nc \
  --arg email "$EMAIL" \
  --arg password "$PASSWORD" \
  '{email: $email, password: $password}')")"

if [[ "$status" != "200" ]]; then
  register_status="$(api POST /auth/register "$(jq -nc \
    --arg email "$EMAIL" \
    --arg password "$PASSWORD" \
    --arg name "$NAME" \
    '{email: $email, password: $password, name: $name}')")"

  if [[ "$register_status" != "201" && "$register_status" != "409" ]]; then
    expect_status "$register_status" "201" "register"
  fi

  login
fi

TOKEN="$(jq -r '.token // empty' "$RESPONSE_FILE")"

if [[ -z "$TOKEN" ]]; then
  echo "FAIL: login did not return a token" >&2
  exit 1
fi

status="$(api GET /api/syllabus)"
expect_status "$status" "200" "GET /api/syllabus"

cp "$RESPONSE_FILE" "$TMP_DIR/syllabus.json"

LESSON_ID="${SMOKE_LESSON_ID:-}"
if [[ -z "$LESSON_ID" ]]; then
  LESSON_ID="$(jq -r \
    '[.data[].topics[].concepts[].lessons[] | select(.status == "AVAILABLE")][0].id // empty' \
    "$TMP_DIR/syllabus.json")"
fi

if [[ -z "$LESSON_ID" ]]; then
  echo "FAIL: no available lesson found for this user" >&2
  exit 1
fi

LESSON_SLUG="$(jq -r --arg id "$LESSON_ID" \
  '[.data[].topics[].concepts[] | select(any(.lessons[]; .id == $id)) | .conceptSlug][0] // empty' \
  "$TMP_DIR/syllabus.json")"

if [[ -z "$LESSON_SLUG" ]]; then
  echo "FAIL: lesson $LESSON_ID was not found in the syllabus payload" >&2
  exit 1
fi

SEED_FILE="$ROOT_DIR/src/db/data/lessons/$LESSON_SLUG.json"
if [[ ! -f "$SEED_FILE" ]]; then
  echo "FAIL: seed file not found: $SEED_FILE" >&2
  exit 1
fi

status="$(api GET "/lessons/$LESSON_ID")"
expect_status "$status" "200" "GET /lessons/$LESSON_ID"
cp "$RESPONSE_FILE" "$TMP_DIR/lesson.json"

status="$(api POST "/lessons/$LESSON_ID/start" '{}')"
expect_status "$status" "201" "POST /lessons/$LESSON_ID/start"
SESSION_ID="$(jq -r '.sessionId // empty' "$RESPONSE_FILE")"

if [[ -z "$SESSION_ID" ]]; then
  echo "FAIL: start did not return a sessionId" >&2
  exit 1
fi

EXERCISE_COUNT="$(jq '.exercises | length' "$TMP_DIR/lesson.json")"

for ((index = 0; index < EXERCISE_COUNT; index++)); do
  exercise="$(jq -c ".exercises[$index]" "$TMP_DIR/lesson.json")"
  exercise_id="$(jq -r '.id' <<<"$exercise")"
  exercise_order="$(jq -r '.order' <<<"$exercise")"
  exercise_type="$(jq -r '.type' <<<"$exercise")"

  case "$exercise_type" in
    MULTIPLE_CHOICE | PREDICT_OUTPUT | FIX_BUG)
      answer="$(jq -c --argjson order "$exercise_order" \
        '{selectedIndex: .exercises[$order - 1].payload.correctIndex}' \
        "$SEED_FILE")"
      ;;
    FILL_BLANK)
      answer="$(jq -c --argjson order "$exercise_order" \
        '.exercises[$order - 1].payload.blanks | {blanks: with_entries(.value = .value[0])}' \
        "$SEED_FILE")"
      ;;
    ARRANGE_LINES)
      answer="$(jq -c --argjson order "$exercise_order" \
        '{order: .exercises[$order - 1].payload.correctOrder}' \
        "$SEED_FILE")"
      ;;
    WRITE_CODE)
      answer="$(jq -c --argjson order "$exercise_order" \
        '.exercises[$order - 1].explanation
          | capture("```python\\n(?<code>[\\s\\S]*?)\\n```")
          | {code: .code, passed: true}' \
        "$SEED_FILE")"
      ;;
    *)
      echo "FAIL: unsupported exercise type $exercise_type" >&2
      exit 1
      ;;
  esac

  status="$(api POST "/exercises/$exercise_id/check" "$(jq -nc \
    --arg sessionId "$SESSION_ID" \
    --argjson answer "$answer" \
    '{sessionId: $sessionId, answer: $answer}')")"
  expect_status "$status" "200" "POST /exercises/$exercise_id/check"

  is_correct="$(jq -r '.correct' "$RESPONSE_FILE")"
  if [[ "$is_correct" != "true" ]]; then
    echo "FAIL: $exercise_type exercise $exercise_id was marked incorrect" >&2
    jq . "$RESPONSE_FILE" >&2
    exit 1
  fi

  echo "check $((index + 1))/$EXERCISE_COUNT $exercise_type: correct"
done

status="$(api POST "/lessons/$LESSON_ID/complete" "$(jq -nc \
  --arg sessionId "$SESSION_ID" \
  '{sessionId: $sessionId}')")"
expect_status "$status" "200" "POST /lessons/$LESSON_ID/complete"
cp "$RESPONSE_FILE" "$TMP_DIR/completion.json"

XP_GAINED="$(jq -r '.xpGained' "$TMP_DIR/completion.json")"
ACCURACY="$(jq -r '.accuracy' "$TMP_DIR/completion.json")"
NEWLY_UNLOCKED="$(jq -c '.newlyUnlocked' "$TMP_DIR/completion.json")"
STREAK="$(jq -c '.streak' "$TMP_DIR/completion.json")"

echo "complete: lesson=$LESSON_ID xpGained=$XP_GAINED accuracy=$ACCURACY streak=$STREAK newlyUnlocked=$NEWLY_UNLOCKED"

status="$(api GET /me/progress)"
expect_status "$status" "200" "GET /me/progress"
echo "progress: $(jq -c \
  '{totalXp, currentStreak, longestStreak, completedLessons: (.completedLessonIds | length)}' \
  "$RESPONSE_FILE")"

echo "replay with: SMOKE_LESSON_ID=$LESSON_ID $0"
