import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '@/database/client';
import {
  habits,
  habitCompletions,
  type Habit,
  type InsertHabit,
  type HabitCompletion,
  type InsertHabitCompletion,
} from '@/database/schema';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export const habitRepository = {
  async getAll(): Promise<Habit[]> {
    return await db.select().from(habits).orderBy(desc(habits.createdAt));
  },

  async getById(id: string): Promise<Habit | undefined> {
    const result = await db.select().from(habits).where(eq(habits.id, id)).limit(1);
    return result[0];
  },

  async create(habit: Omit<InsertHabit, 'id'>): Promise<Habit> {
    const now = new Date();
    const newHabit: InsertHabit = {
      ...habit,
      id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
    };
    await db.insert(habits).values(newHabit);
    return newHabit as Habit;
  },

  async update(id: string, habit: Partial<InsertHabit>): Promise<Habit | undefined> {
    await db.update(habits).set(habit).where(eq(habits.id, id));
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    await db.delete(habits).where(eq(habits.id, id));
    return true;
  },

  async getCompletions(habitId: string): Promise<HabitCompletion[]> {
    return await db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.habitId, habitId))
      .orderBy(desc(habitCompletions.completionDate));
  },

  async getCompletionsByMonth(habitId: string, year: number, month: number): Promise<HabitCompletion[]> {
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));

    return await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.habitId, habitId),
          sql`${habitCompletions.completionDate} >= ${start.getTime() / 1000}`,
          sql`${habitCompletions.completionDate} <= ${end.getTime() / 1000}`
        )
      )
      .orderBy(desc(habitCompletions.completionDate));
  },

  async addCompletion(habitId: string, date: Date): Promise<HabitCompletion> {
    const startOfDayTimestamp = startOfDay(date);
    const newCompletion = {
      id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      habitId,
      completionDate: startOfDayTimestamp,
      createdAt: new Date(),
    };
    await db.insert(habitCompletions).values(newCompletion);
    return newCompletion as HabitCompletion;
  },

  async removeCompletion(habitId: string, date: Date): Promise<boolean> {
    const startOfDayTimestamp = startOfDay(date).getTime() / 1000;
    const endOfDayTimestamp = endOfDay(date).getTime() / 1000;

    await db
      .delete(habitCompletions)
      .where(
        and(
          eq(habitCompletions.habitId, habitId),
          sql`${habitCompletions.completionDate} >= ${startOfDayTimestamp}`,
          sql`${habitCompletions.completionDate} <= ${endOfDayTimestamp}`
        )
      );
    return true;
  },

  async isCompletedOnDate(habitId: string, date: Date): Promise<boolean> {
    const startOfDayTimestamp = startOfDay(date).getTime() / 1000;
    const endOfDayTimestamp = endOfDay(date).getTime() / 1000;

    const result = await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.habitId, habitId),
          sql`${habitCompletions.completionDate} >= ${startOfDayTimestamp}`,
          sql`${habitCompletions.completionDate} <= ${endOfDayTimestamp}`
        )
      )
      .limit(1);

    return result.length > 0;
  },

  async getCurrentStreak(habitId: string): Promise<number> {
    const completions = await this.getCompletions(habitId);
    if (completions.length === 0) return 0;

    const sortedDates = completions
      .map((c) => startOfDay(new Date(c.completionDate)))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let currentDate = startOfDay(new Date());

    for (const completionDate of sortedDates) {
      const daysDiff = differenceInDays(currentDate, completionDate);

      if (daysDiff === 0 || daysDiff === 1) {
        streak++;
        currentDate = completionDate;
      } else {
        break;
      }
    }

    return streak;
  },

  async getMonthlyProgress(habitId: string, year: number, month: number) {
    const completions = await this.getCompletionsByMonth(habitId, year, month);
    const daysInMonth = endOfMonth(new Date(year, month)).getDate();
    const completedDays = completions.length;

    return {
      completedDays,
      totalDays: daysInMonth,
      percentage: (completedDays / daysInMonth) * 100,
    };
  },
};
