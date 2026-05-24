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
├── api/            # API client configuration (axios)
├── screens/        # Screen components (Dashboard, Workout, Analytics, Settings)
├── navigation/     # Bottom tab and stack navigation setup
├── components/     # Reusable UI components
├── types/          # TypeScript type definitions
├── theme/          # Theme configuration and styles
├── utils/          # Utility functions
├── hooks/          # Custom React hooks (if needed)  
├── services/       # Business logic services
└── context/        # React Context for state management
```

### API Configuration

The app connects to the backend API defined in `app.json`:

```json
{
  "extra": {
    "apiUrl": "http://localhost:8080/api"
  }
}
```

Update this URL for your environment (development, staging, production).

### Dependencies

- **expo**: Core framework and managed services
- **react-native**: UI library
- **@react-navigation/***: Navigation system
- **react-native-paper**: Material Design UI components
- **axios**: HTTP client
- **react-native-vector-icons**: Icon library

### Backend Integration

The frontend API client is configured in `src/api/index.ts` with:
- Base URL from `expo-constants`
- Request/response interceptors for auth and error handling
- Timeout configuration

### Screens

- **Dashboard**: Overview of total workouts, weekly activity, volume, and measurements
- **Workout**: List of workouts with ability to add new entries
- **Analytics**: Charts and metrics for strength trends, volume progress, consistency
- **Settings**: Account, notifications, privacy, and app information

### Development Tips

1. Hot reload: Changes to files are automatically reflected
2. Use `expo-constants` to manage environment variables
3. The app uses React Navigation for routing
4. Material Design 3 theming via react-native-paper
5. TypeScript for type safety

### Troubleshooting

If dependencies fail to install, try:
```bash
npm install --legacy-peer-deps
```

For clear cache:
```bash
expo cache clean
expo start --clear
```
