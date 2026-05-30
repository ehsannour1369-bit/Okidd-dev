import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
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
  // JSON arrays for specific recipients (null = همه / all in category)
  recipientStudentIds: text("recipient_student_ids"),
  recipientTeacherIds: text("recipient_teacher_ids"),
  recipientClassIds: text("recipient_class_ids"),
  recipientBranchIds: text("recipient_branch_ids"),
  recipientGrades: text("recipient_grades"),
  recipientGradeLevels: text("recipient_grade_levels"),
  // Sender info (null = sent by system/admin)
  fromUserId: integer("from_user_id"),
  fromRole: text("from_role"),
  fromName: text("from_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
