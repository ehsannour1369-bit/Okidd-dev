import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gradeLevelsTable = pgTable("grade_levels", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  name: text("name").notNull(),
  level: text("level"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGradeLevelSchema = createInsertSchema(gradeLevelsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGradeLevel = z.infer<typeof insertGradeLevelSchema>;
export type GradeLevel = typeof gradeLevelsTable.$inferSelect;
