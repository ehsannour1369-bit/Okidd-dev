import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const classesTable = pgTable("classes", {
  id: serial("id").primaryKey(),
  gradeId: integer("grade_id").notNull(),
  name: text("name").notNull(),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const classTeachersTable = pgTable("class_teachers", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  bookId: integer("book_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classStudentsTable = pgTable("class_students", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  studentId: integer("student_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classBooksTable = pgTable("class_books", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  bookId: integer("book_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const schoolTeachersTable = pgTable("school_teachers", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classesTable.$inferSelect;
