import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const consultantsTable = pgTable("consultants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  schoolId: integer("school_id").notNull(),
  specialty: text("specialty"),
  about: text("about"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertConsultantSchema = createInsertSchema(consultantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConsultant = z.infer<typeof insertConsultantSchema>;
export type Consultant = typeof consultantsTable.$inferSelect;
