#!/usr/bin/env bash
# Starts Gym Tracker: Quarkus API + web UI (+ optional Expo).
# Usage: ./scripts/start-app.sh [--no-expo] [--skip-browser]

set -euo pipefail

GYM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$GYM_ROOT/backend"
WEB="$GYM_ROOT/web"
FRONTEND="$GYM_ROOT/frontend"
WEB_PORT=3000
EXPO_PORT=8082
API_PORT=8080
NO_EXPO=0
SKIP_BROWSER=0

for arg in "$@"; do
  case "$arg" in
    --no-expo) NO_EXPO=1 ;;
    --skip-browser) SKIP_BROWSER=1 ;;
  esac
done

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | grep -q ":$1 "
  else
    lsof -i ":$1" -sTCP:LISTEN >/dev/null 2>&1
  fi
}

wait_for_api() {
  local url="http://localhost:$API_PORT/api/workouts"
  echo "Waiting for API at $url ..."
  for _ in $(seq 1 60); do
    if curl -sf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

echo ""
echo "Gym Tracker — starting services"
echo "  Root: $GYM_ROOT"
echo ""

if ! port_in_use "$API_PORT"; then
  echo "[API] Starting Quarkus on http://localhost:$API_PORT ..."
  (cd "$BACKEND" && mvn quarkus:dev -Dquarkus.enforceBuildGoal=false) &
  API_PID=$!
else
  echo "[API] Port $API_PORT already in use."
fi

if ! port_in_use "$WEB_PORT"; then
  echo "[Web] Starting on http://localhost:$WEB_PORT ..."
  (cd "$WEB" && npx --yes serve . -l "$WEB_PORT") &
  WEB_PID=$!
else
  echo "[Web] Port $WEB_PORT already in use."
fi

if [[ "$NO_EXPO" -eq 0 && -d "$FRONTEND" ]] && ! port_in_use "$EXPO_PORT"; then
  echo "[Expo] Starting on http://localhost:$EXPO_PORT ..."
  (cd "$FRONTEND" && EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1 npx expo start --port "$EXPO_PORT") &
  EXPO_PID=$!
fi

if wait_for_api; then
  echo "[API] Ready."
else
  echo "[API] Timed out — check Maven/Java in the backend terminal."
fi

if [[ "$SKIP_BROWSER" -eq 0 ]]; then
  if command -v xdg-open >/dev/null; then
    xdg-open "http://localhost:$WEB_PORT" >/dev/null 2>&1 || true
  elif command -v open >/dev/null; then
    open "http://localhost:$WEB_PORT"
  fi
fi

echo ""
echo "Running:"
echo "  API     http://localhost:$API_PORT"
echo "  Web     http://localhost:$WEB_PORT"
echo "  Expo    http://localhost:$EXPO_PORT (if started)"
echo ""
echo "Press Ctrl+C to stop (background PIDs: ${API_PID:-} ${WEB_PID:-} ${EXPO_PID:-})"
wait
