# FocusGuard

A productivity mobile app built with React Native and Expo that helps you manage daily tasks and track meeting costs.

## Features

### Task Management
- Daily task list with configurable limit (default: 5 tasks)
- Priority colors assigned by task order
- Check/uncheck tasks for completion
- Edit tasks inline
- Daily reset at midnight (local timezone)
- Task history tracking

### Meeting Cost Calculator
- Real-time cost calculation based on attendee count and average salary
- Start/Stop/Reset controls
- Per-minute and per-hour rate display
- Share meeting cost summary
- Fun facts about meeting costs

### Focus Timer
- Pomodoro-style timer with multiple presets:
  - Classic (25/5/15 min)
  - Deep Work (50/10/20 min)
  - Sprint (15/5/15 min)
- Link tasks to focus sessions
- Break notifications
- Session history calendar

### Additional Features
- Dark/Light theme support
- Ambient sounds for focus sessions
- Music playlist links (Spotify/YouTube)
- Analytics dashboard
- CSV data export

## Tech Stack

- **Framework:** React Native with Expo SDK 54
- **Navigation:** Expo Router (file-based routing)
- **Language:** TypeScript
- **Storage:** AsyncStorage (Firebase ready)
- **Platforms:** iOS, Android, Web

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/PominausGH/focusguard.git
cd focusguard

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running the App

- **Web:** Press `w` or visit http://localhost:8081
- **iOS Simulator:** Press `i` (requires Xcode)
- **Android Emulator:** Press `a` (requires Android Studio)
- **Physical Device:** Scan QR code with Expo Go app

## Project Structure

```
focusguard/
├── app/                    # Screens (Expo Router)
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Tasks screen
│   │   ├── meeting.tsx    # Meeting calculator
│   │   └── settings.tsx   # User settings
│   ├── auth.tsx           # Login/signup
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── contexts/              # React contexts (Auth, Task, Theme, Focus)
├── hooks/                 # Custom hooks
├── services/              # Analytics, ambient sounds
├── types/                 # TypeScript definitions
└── utils/                 # Utilities (CSV export)
```

## Configuration

Key constants in `types/index.ts`:

```typescript
MAX_DAILY_TASKS = 5        // Maximum tasks per day
MAX_SUBTASKS_PER_TASK = 3  // Subtasks per task
DEFAULT_SALARY = 75000     // Default salary for meeting calculator
```

## License

MIT
