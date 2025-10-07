import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('productivity.db', { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });

export async function initializeDatabase() {
  try {
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date INTEGER,
        category TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        time TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        modified_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        color TEXT NOT NULL DEFAULT '#8B7355',
        pinned INTEGER NOT NULL DEFAULT 0,
        images TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        modified_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL DEFAULT '#10B981',
        icon TEXT DEFAULT 'check',
        target_frequency INTEGER NOT NULL DEFAULT 7,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS habit_completions (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        completion_date INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'Strength',
        duration INTEGER NOT NULL,
        estimated_calories TEXT DEFAULT '0-0',
        icon TEXT DEFAULT 'dumbbell',
        color TEXT NOT NULL DEFAULT '#EF4444',
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sets INTEGER NOT NULL DEFAULT 3,
        reps INTEGER NOT NULL DEFAULT 10,
        weight INTEGER DEFAULT 0,
        notes TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workout_completions (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL,
        completion_date INTEGER NOT NULL,
        actual_duration INTEGER,
        actual_calories INTEGER,
        notes TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
      CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned);
      CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completion_date);
      CREATE INDEX IF NOT EXISTS idx_workout_completions_date ON workout_completions(completion_date);
    `);

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}
