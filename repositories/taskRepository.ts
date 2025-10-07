import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { db } from '@/database/client';
import { tasks, type Task, type InsertTask } from '@/database/schema';

export const taskRepository = {
  async getAll(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  },

  async getById(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          sql`${tasks.dueDate} >= ${startDate.getTime() / 1000}`,
          sql`${tasks.dueDate} <= ${endDate.getTime() / 1000}`
        )
      )
      .orderBy(asc(tasks.dueDate));
  },

  async getByPriority(priority: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.priority, priority))
      .orderBy(desc(tasks.createdAt));
  },

  async getCompleted(): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.completed, true))
      .orderBy(desc(tasks.modifiedAt));
  },

  async getPending(): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.completed, false))
      .orderBy(asc(tasks.dueDate));
  },

  async create(task: Omit<InsertTask, 'id'>): Promise<Task> {
    const now = new Date();
    const newTask: InsertTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      modifiedAt: now,
    };
    await db.insert(tasks).values(newTask);
    return newTask as Task;
  },

  async update(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const now = new Date();
    await db
      .update(tasks)
      .set({ ...task, modifiedAt: now })
      .where(eq(tasks.id, id));
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  },

  async toggleComplete(id: string): Promise<Task | undefined> {
    const task = await this.getById(id);
    if (task) {
      return this.update(id, { completed: !task.completed });
    }
    return undefined;
  },

  async getStatistics() {
    const allTasks = await this.getAll();
    const completed = allTasks.filter((t) => t.completed).length;
    const total = allTasks.length;
    const highPriority = allTasks.filter((t) => t.priority === 'high').length;
    const mediumPriority = allTasks.filter((t) => t.priority === 'medium').length;
    const lowPriority = allTasks.filter((t) => t.priority === 'low').length;

    return {
      total,
      completed,
      pending: total - completed,
      highPriority,
      mediumPriority,
      lowPriority,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  },

  async search(query: string): Promise<Task[]> {
    const allTasks = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return allTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery) ||
        task.category?.toLowerCase().includes(lowerQuery)
    );
  },
};
