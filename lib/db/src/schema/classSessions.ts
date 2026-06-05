import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const classSessionsTable = pgTable("class_sessions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  title: text("title").notNull(),
  roomCode: text("room_code").notNull(),
  status: text("status").notNull().default("active"), // "active" | "ended"
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassSessionSchema = createInsertSchema(classSessionsTable).omit({ id: true, startedAt: true, createdAt: true });
export type InsertClassSession = z.infer<typeof insertClassSessionSchema>;
export type ClassSession = typeof classSessionsTable.$inferSelect;
