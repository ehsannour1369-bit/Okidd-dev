import { pgTable, serial, integer, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentBooksTable = pgTable("student_books", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  bookId: integer("book_id").notNull(),
  schoolId: integer("school_id").notNull(),
  assignedBy: integer("assigned_by"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [unique("student_books_student_book_unique").on(t.studentId, t.bookId)]);

export const insertStudentBookSchema = createInsertSchema(studentBooksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentBook = z.infer<typeof insertStudentBookSchema>;
export type StudentBook = typeof studentBooksTable.$inferSelect;
