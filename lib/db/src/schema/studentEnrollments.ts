import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Tracks year-by-year student-school membership.
// Constraint: one active enrollment per student per academic_year — enforced at application layer.
// users.schoolId is kept in sync as a convenience cache for the current active school.
export const studentEnrollmentsTable = pgTable("student_enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  schoolId: integer("school_id").notNull(),
  branchId: integer("branch_id"),
  academicYear: text("academic_year").notNull().default("1403-1404"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentEnrollmentSchema = createInsertSchema(studentEnrollmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentEnrollment = z.infer<typeof insertStudentEnrollmentSchema>;
export type StudentEnrollment = typeof studentEnrollmentsTable.$inferSelect;
