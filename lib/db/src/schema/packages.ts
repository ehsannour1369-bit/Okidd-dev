import { pgTable, text, serial, timestamp, integer, numeric, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const packagesTable = pgTable("packages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  schoolId: integer("school_id"),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull().default("0"),
  studentCount: integer("student_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const packageBooksTable = pgTable("package_books", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").notNull(),
  bookId: integer("book_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookLicenseTransactionsTable = pgTable("book_license_transactions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull(),
  bookId: integer("book_id").notNull(),
  quantity: integer("quantity").notNull(),
  trackingNumber: varchar("tracking_number", { length: 100 }).notNull(),
  paymentDate: varchar("payment_date", { length: 20 }),
  amount: numeric("amount", { precision: 12, scale: 0 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique("book_license_transactions_tracking_number_unique").on(t.trackingNumber)]);

export const insertPackageSchema = createInsertSchema(packagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packagesTable.$inferSelect;

export const insertBookLicenseTransactionSchema = createInsertSchema(bookLicenseTransactionsTable).omit({ id: true, createdAt: true });
export type InsertBookLicenseTransaction = z.infer<typeof insertBookLicenseTransactionSchema>;
export type BookLicenseTransaction = typeof bookLicenseTransactionsTable.$inferSelect;
