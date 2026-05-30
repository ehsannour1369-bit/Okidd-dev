import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameScoresTable = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  score: integer("score").notNull().default(0),
  gameName: text("game_name").default("default"),
  playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameScoreSchema = createInsertSchema(gameScoresTable).omit({ id: true, createdAt: true });
export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
export type GameScore = typeof gameScoresTable.$inferSelect;
