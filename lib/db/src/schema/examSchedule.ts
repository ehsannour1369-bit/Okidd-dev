import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const examScheduleTable = pgTable("exam_schedule", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull(),
  classId: integer("class_id"),
  lessonName: text("lesson_name").notNull(),
  examDate: text("exam_date").notNull(),
  examPages: text("exam_pages"),
  examTime: text("exam_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertExamScheduleSchema = createInsertSchema(examScheduleTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExamSchedule = z.infer<typeof insertExamScheduleSchema>;
export type ExamSchedule = typeof examScheduleTable.$inferSelect;
