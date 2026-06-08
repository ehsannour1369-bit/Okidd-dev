import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const schoolsTable = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id"),
  managerUserId: integer("manager_user_id"),
  address: text("address"),
  phone: text("phone"),
  managerName: text("manager_name"),
  managerPhone: text("manager_phone"),
  managerNationalId: text("manager_national_id"),
  logoUrl: text("logo_url"),
  schoolType: text("school_type").default("mixed"),
  videoConferenceUrl: text("video_conference_url"),
  skyroomApiKey: text("skyroom_api_key"),
  status: text("status").notNull().default("inactive"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSchoolSchema = createInsertSchema(schoolsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schoolsTable.$inferSelect;
