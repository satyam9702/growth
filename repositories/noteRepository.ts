import { eq, desc } from 'drizzle-orm';
import { db } from '@/database/client';
import { notes, type Note, type InsertNote } from '@/database/schema';

export const noteRepository = {
  async getAll(): Promise<Note[]> {
    return await db.select().from(notes).orderBy(desc(notes.pinned), desc(notes.createdAt));
  },

  async getById(id: string): Promise<Note | undefined> {
    const result = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
    return result[0];
  },

  async getPinned(): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.pinned, true))
      .orderBy(desc(notes.modifiedAt));
  },

  async create(note: Omit<InsertNote, 'id'>): Promise<Note> {
    const now = new Date();
    const newNote: InsertNote = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      modifiedAt: now,
    };
    await db.insert(notes).values(newNote);
    return newNote as Note;
  },

  async update(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const now = new Date();
    await db
      .update(notes)
      .set({ ...note, modifiedAt: now })
      .where(eq(notes.id, id));
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    await db.delete(notes).where(eq(notes.id, id));
    return true;
  },

  async togglePin(id: string): Promise<Note | undefined> {
    const note = await this.getById(id);
    if (note) {
      return this.update(id, { pinned: !note.pinned });
    }
    return undefined;
  },

  async search(query: string): Promise<Note[]> {
    const allNotes = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return allNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content?.toLowerCase().includes(lowerQuery)
    );
  },

  async getCount(): Promise<number> {
    const allNotes = await this.getAll();
    return allNotes.length;
  },
};
