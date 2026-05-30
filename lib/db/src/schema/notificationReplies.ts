import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationRepliesTable = pgTable("notification_replies", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull(),
  senderId: integer("sender_id").notNull(),
  senderRole: text("sender_role").notNull(),
  senderName: text("sender_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationReplySchema = createInsertSchema(notificationRepliesTable).omit({ id: true, createdAt: true });
export type InsertNotificationReply = z.infer<typeof insertNotificationReplySchema>;
export type NotificationReply = typeof notificationRepliesTable.$inferSelect;
