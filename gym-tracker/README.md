# Gym Progress Tracker

Full-stack 8-week gym tracker: **Quarkus API** (JSON storage), **React Native (Expo)** mobile app, and **web UI**.

## Quick start

```powershell
# From gym-tracker folder
.\start-app.bat
```

Or: `.\scripts\start-app.ps1` — starts API (8080), web (3000), and Expo (8082).

| Service | URL |
|---------|-----|
| API / Swagger | http://localhost:8080 · http://localhost:8080/q/swagger-ui |
| Web UI | http://localhost:3000 |
| Expo | http://localhost:8082 |

## Project layout

- `backend/` — Quarkus REST API, JSON file persistence
- `frontend/` — Expo app (Dashboard, Today, Log, Analytics, …)
- `web/` — Static web client (plan parse, workouts, dashboard)
- `scripts/` — `start-app.ps1`, `seed-dummy-4-weeks.mjs`

## Requirements

- Java 21+ and Maven
- Node.js 18+

## Dummy data

```bash
cd backend
node scripts/seed-dummy-4-weeks.mjs
```
