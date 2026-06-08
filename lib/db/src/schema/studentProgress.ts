import { pgTable, serial, timestamp, integer, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const LESSON_STAGES = ["none", "animation", "game", "quiz", "completed"] as const;
export type LessonStage = typeof LESSON_STAGES[number];

export const studentProgressTable = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  classId: integer("class_id"),
  bookId: integer("book_id"),
  completed: boolean("completed").notNull().default(false),
  score: integer("score").notNull().default(0),
  lessonStage: varchar("lesson_stage", { length: 20 }).notNull().default("none"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const lessonUnlocksTable = pgTable("lesson_unlocks", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  bookId: integer("book_id").notNull(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const presenceLogTable = pgTable("presence_log", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id"),
  enteredAt: timestamp("entered_at", { withTimezone: true }).notNull().defaultNow(),
  exitedAt: timestamp("exited_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
});

export const insertStudentProgressSchema = createInsertSchema(studentProgressTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentProgress = z.infer<typeof insertStudentProgressSchema>;
export type StudentProgress = typeof studentProgressTable.$inferSelect;
