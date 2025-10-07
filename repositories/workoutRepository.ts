import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '@/database/client';
import {
  workouts,
  exercises,
  workoutCompletions,
  type Workout,
  type InsertWorkout,
  type Exercise,
  type InsertExercise,
  type WorkoutCompletion,
  type InsertWorkoutCompletion,
} from '@/database/schema';
import { subDays } from 'date-fns';

export const workoutRepository = {
  async getAll(): Promise<Workout[]> {
    return await db.select().from(workouts).orderBy(desc(workouts.createdAt));
  },

  async getById(id: string): Promise<Workout | undefined> {
    const result = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);
    return result[0];
  },

  async create(workout: Omit<InsertWorkout, 'id'>): Promise<Workout> {
    const now = new Date();
    const newWorkout: InsertWorkout = {
      ...workout,
      id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
    };
    await db.insert(workouts).values(newWorkout);
    return newWorkout as Workout;
  },

  async update(id: string, workout: Partial<InsertWorkout>): Promise<Workout | undefined> {
    await db.update(workouts).set(workout).where(eq(workouts.id, id));
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    await db.delete(workouts).where(eq(workouts.id, id));
    return true;
  },

  async getExercises(workoutId: string): Promise<Exercise[]> {
    return await db
      .select()
      .from(exercises)
      .where(eq(exercises.workoutId, workoutId))
      .orderBy(exercises.order);
  },

  async addExercise(exercise: InsertExercise): Promise<Exercise> {
    const newExercise = {
      ...exercise,
      id: exercise.id || `exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    await db.insert(exercises).values(newExercise);
    return newExercise as Exercise;
  },

  async updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined> {
    await db.update(exercises).set(exercise).where(eq(exercises.id, id));
    const result = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
    return result[0];
  },

  async deleteExercise(id: string): Promise<boolean> {
    await db.delete(exercises).where(eq(exercises.id, id));
    return true;
  },

  async getCompletions(workoutId: string): Promise<WorkoutCompletion[]> {
    return await db
      .select()
      .from(workoutCompletions)
      .where(eq(workoutCompletions.workoutId, workoutId))
      .orderBy(desc(workoutCompletions.completionDate));
  },

  async addCompletion(completion: Omit<InsertWorkoutCompletion, 'id'>): Promise<WorkoutCompletion> {
    const now = new Date();
    const newCompletion: InsertWorkoutCompletion = {
      ...completion,
      id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      completionDate: completion.completionDate || now,
    };
    await db.insert(workoutCompletions).values(newCompletion);
    return newCompletion as WorkoutCompletion;
  },

  async getLastCompletion(workoutId: string): Promise<WorkoutCompletion | undefined> {
    const result = await db
      .select()
      .from(workoutCompletions)
      .where(eq(workoutCompletions.workoutId, workoutId))
      .orderBy(desc(workoutCompletions.completionDate))
      .limit(1);
    return result[0];
  },

  async getFrequencyBadge(workoutId: string): Promise<number> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const completions = await db
      .select()
      .from(workoutCompletions)
      .where(
        and(
          eq(workoutCompletions.workoutId, workoutId),
          sql`${workoutCompletions.completionDate} >= ${thirtyDaysAgo.getTime() / 1000}`
        )
      );
    return completions.length;
  },

  async getWorkoutWithDetails(workoutId: string) {
    const workout = await this.getById(workoutId);
    if (!workout) return null;

    const exercisesList = await this.getExercises(workoutId);
    const completions = await this.getCompletions(workoutId);
    const lastCompletion = await this.getLastCompletion(workoutId);
    const frequency = await this.getFrequencyBadge(workoutId);

    const totalWeight = exercisesList.reduce((sum, ex) => {
      return sum + (ex.weight || 0) * ex.sets * ex.reps;
    }, 0);

    const totalReps = exercisesList.reduce((sum, ex) => {
      return sum + ex.sets * ex.reps;
    }, 0);

    return {
      ...workout,
      exercises: exercisesList,
      totalCompletions: completions.length,
      lastCompletion,
      frequency,
      totalWeight,
      totalReps,
    };
  },

  async getTotalPoints(workoutId: string): Promise<number> {
    const completions = await this.getCompletions(workoutId);
    return completions.length * 10;
  },
};
