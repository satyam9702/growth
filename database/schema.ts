import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('medium'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  category: text('category'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  time: text('time'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  modifiedAt: integer('modified_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  color: text('color').notNull().default('#8B7355'),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  images: text('images'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  modifiedAt: integer('modified_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#10B981'),
  icon: text('icon').default('check'),
  targetFrequency: integer('target_frequency').notNull().default(7),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const habitCompletions = sqliteTable('habit_completions', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  completionDate: integer('completion_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').default('Strength'),
  duration: integer('duration').notNull(),
  estimatedCalories: text('estimated_calories').default('0-0'),
  icon: text('icon').default('dumbbell'),
  color: text('color').notNull().default('#EF4444'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sets: integer('sets').notNull().default(3),
  reps: integer('reps').notNull().default(10),
  weight: integer('weight').default(0),
  notes: text('notes'),
  order: integer('order').notNull().default(0),
});

export const workoutCompletions = sqliteTable('workout_completions', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  completionDate: integer('completion_date', { mode: 'timestamp' }).notNull(),
  actualDuration: integer('actual_duration'),
  actualCalories: integer('actual_calories'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = typeof habits.$inferInsert;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertHabitCompletion = typeof habitCompletions.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = typeof workouts.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;
export type WorkoutCompletion = typeof workoutCompletions.$inferSelect;
export type InsertWorkoutCompletion = typeof workoutCompletions.$inferInsert;
