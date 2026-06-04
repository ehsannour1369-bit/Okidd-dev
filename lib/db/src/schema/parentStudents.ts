import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const parentStudentsTable = pgTable("parent_students", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => usersTable.id),
  studentId: integer("student_id").notNull().references(() => usersTable.id),
  relationType: text("relation_type").notNull().default("guardian"), // father | mother | guardian
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by"), // user id of who created the link
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ParentStudent = typeof parentStudentsTable.$inferSelect;
