import { pgTable, text, serial, timestamp, integer, numeric, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookOrdersTable = pgTable("book_orders", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull(),
  trackingNumber: varchar("tracking_number", { length: 100 }).notNull(),
  discount: numeric("discount", { precision: 5, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 0 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 0 }).notNull().default("0"),
  finalAmount: numeric("final_amount", { precision: 12, scale: 0 }).notNull().default("0"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [unique("book_orders_tracking_number_unique").on(t.trackingNumber)]);

export const bookOrderItemsTable = pgTable("book_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  bookId: integer("book_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 0 }).notNull().default("0"),
  subtotal: numeric("subtotal", { precision: 12, scale: 0 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const walletsTable = pgTable("wallets", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().unique(),
  balance: numeric("balance", { precision: 14, scale: 0 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  schoolId: integer("school_id").notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 0 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 14, scale: 0 }).notNull().default("0"),
  description: text("description"),
  referenceId: integer("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookOrderSchema = createInsertSchema(bookOrdersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBookOrder = z.infer<typeof insertBookOrderSchema>;
export type BookOrder = typeof bookOrdersTable.$inferSelect;

export const insertBookOrderItemSchema = createInsertSchema(bookOrderItemsTable).omit({ id: true, createdAt: true });
export type InsertBookOrderItem = z.infer<typeof insertBookOrderItemSchema>;
export type BookOrderItem = typeof bookOrderItemsTable.$inferSelect;

export const insertWalletSchema = createInsertSchema(walletsTable).omit({ id: true, updatedAt: true });
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof walletsTable.$inferSelect;

export const insertWalletTransactionSchema = createInsertSchema(walletTransactionsTable).omit({ id: true, createdAt: true });
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
