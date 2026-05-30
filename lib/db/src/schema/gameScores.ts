import { pgTable, serial, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameScoresTable = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  gameType: varchar("game_type", { length: 50 }).notNull().default("balloon"),
  score: integer("score").notNull().default(0),
  playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameScoresSchema = createInsertSchema(gameScoresTable).omit({ id: true, playedAt: true });
export type InsertGameScore = z.infer<typeof insertGameScoresSchema>;
export type GameScore = typeof gameScoresTable.$inferSelect;
