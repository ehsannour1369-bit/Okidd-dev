import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const classSchedulesTable = pgTable("class_schedules", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=شنبه … 5=پنجشنبه
  startTime: text("start_time").notNull(), // "08:00"
  endTime: text("end_time").notNull(),     // "09:30"
  subject: text("subject").notNull(),
  teacherId: integer("teacher_id"),
  academicYear: text("academic_year").notNull().default("1404"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClassScheduleSchema = createInsertSchema(classSchedulesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClassSchedule = z.infer<typeof insertClassScheduleSchema>;
export type ClassSchedule = typeof classSchedulesTable.$inferSelect;
