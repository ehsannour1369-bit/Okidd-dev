import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const progressChartTable = pgTable("progress_chart", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  bookId: integer("book_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  teachDate: text("teach_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProgressChartSchema = createInsertSchema(progressChartTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProgressChart = z.infer<typeof insertProgressChartSchema>;
export type ProgressChart = typeof progressChartTable.$inferSelect;
