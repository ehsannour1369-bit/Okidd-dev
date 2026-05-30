import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Tracks history of branch manager assignments.
// Constraint: one active manager per branch per academic_year — enforced at application layer.
export const branchManagersTable = pgTable("branch_managers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  branchId: integer("branch_id").notNull(),
  academicYear: text("academic_year").notNull().default("1403-1404"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBranchManagerSchema = createInsertSchema(branchManagersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBranchManager = z.infer<typeof insertBranchManagerSchema>;
export type BranchManager = typeof branchManagersTable.$inferSelect;
