import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  targetRole: text("target_role").notNull().default("student"),
  branchId: integer("branch_id"),
  gradeLevelId: integer("grade_level_id"),
  classId: integer("class_id"),
  senderId: integer("sender_id"),
  targetUserId: integer("target_user_id"),
  type: text("type").notNull().default("manual"),
  allowReply: boolean("allow_reply").notNull().default(true),
  status: text("status").notNull().default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
