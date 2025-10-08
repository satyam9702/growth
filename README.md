# Productivity Hub

A fully offline, all-in-one productivity Android app built with React Native and Expo.

## Features

### 📝 Task Management
- Create, edit, and delete tasks
- Priority levels (High, Medium, Low) with color coding
- Task categories and time assignments
- Filter by status (All, Completed, Pending)
- Weekly calendar view
- Completion tracking

### 📔 Notes
- Create and organize notes with rich content
- 8 color themes for visual organization
- Pin important notes to the top
- Search functionality
- Edit and delete capabilities

### 📊 Statistics Dashboard
- Real-time task analytics
- Interactive donut chart for priority breakdown
- Completion rate tracking
- Visual progress indicators

### 📅 Habit Tracker
- Create and manage multiple habits
- Monthly calendar view
- Visual completion tracking (green highlights)
- Current streak calculation
- Monthly progress with percentage
- Navigate between months

### 💪 Workout Management
- Create custom workouts
- Add exercises with sets, reps, and weights
- Track workout completions
- Frequency badges
- Grid and list view modes
- Duration and calorie estimates

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: SQLite with Drizzle ORM
- **Navigation**: Expo Router
- **UI**: React Native components with custom styling
- **Icons**: Lucide React Native

## Architecture

- **Offline-First**: 100% offline functionality with local SQLite database
- **Clean Architecture**: Repository pattern for data access
- **Type-Safe**: Full TypeScript implementation
- **Modular**: Component-based architecture

## Database Schema

### Tables
- `tasks` - Task management with priorities and categories
- `notes` - Note storage with colors and pinning
- `habits` - Habit definitions
- `habit_completions` - Daily habit completion tracking
- `workouts` - Workout definitions
- `exercises` - Exercise details per workout
- `workout_completions` - Workout completion history

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Run on your device:
- Scan the QR code with Expo Go app
- Or press 'a' for Android emulator
- Or press 'i' for iOS simulator

## Project Structure

```
.
├── app/                    # Application screens
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Tasks screen
│   │   ├── notes.tsx      # Notes screen
│   │   ├── statistics.tsx # Statistics screen
│   │   ├── habits.tsx     # Habits screen
│   │   └── workouts.tsx   # Workouts screen
│   └── _layout.tsx        # Root layout
├── database/              # Database layer
│   ├── client.ts          # Database connection
│   └── schema.ts          # Database schema
├── repositories/          # Data access layer
│   ├── taskRepository.ts
│   ├── noteRepository.ts
│   ├── habitRepository.ts
│   └── workoutRepository.ts
└── hooks/                 # Custom React hooks
```

## Color Scheme

- **Background**: Dark Gray (#111827, #1F2937)
- **Primary (Success)**: Green (#10B981)
- **High Priority**: Red (#EF4444)
- **Medium Priority**: Yellow/Gold (#F59E0B)
- **Low Priority**: Green (#10B981)
- **Info**: Blue (#3B82F6)
- **Text**: White (#FFFFFF)
- **Secondary Text**: Gray (#9CA3AF)

## Scripts

- `npm run dev` - Start development server
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run build:web` - Build for web

## License

MIT
