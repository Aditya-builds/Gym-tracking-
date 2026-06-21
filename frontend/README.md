# Gym Tracker Frontend

React Native mobile app built with Expo for tracking workouts, measurements, and analytics.

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### Project Structure

```
src/
├── api/            # Axios API modules (apiClient, workoutApi, planApi, …)
├── screens/        # Dashboard, Today, Log, Analytics, Measurements, Summary, Backup
├── navigation/     # AppNavigator + AppShell tab layout
├── components/     # Reusable UI (AppShell, SetLoggerModal)
├── theme/          # colors.ts, todayColors.ts
├── utils/          # planUtils and shared helpers
└── services/       # todayWorkoutService (Today tab ↔ Quarkus API)
```

### API Configuration

The app connects to the Quarkus backend via `src/api/apiClient.ts`:

- Android emulator: `http://10.0.2.2:8080`
- iOS / web / default: `http://localhost:8080`
- Override with `extra.apiBaseUrl` in `app.json`

### Backend Integration

All tabs use the Quarkus REST API on port 8080:

- **Today** — loads plan from `/api/plan`, logs sets via `/api/workouts`, `/api/exercises`, `/api/sets`
- **Log** — full session-based workout logging
- **Dashboard / Summary / Analytics / Measurements / Backup** — respective `/api/*` endpoints

Start the full stack from the repo root: `.\start-app.ps1`

### Screens

- **Dashboard**: Overview of workouts, volume, and measurements
- **Today**: Day-by-day plan view with set logger synced to the API
- **Log**: Session-based workout logging
- **Analytics**: Exercise progress charts
- **Measurements**: Weekly body check-ins
- **Summary**: Weekly training summary
- **Backup**: Export/import plan and backup data
