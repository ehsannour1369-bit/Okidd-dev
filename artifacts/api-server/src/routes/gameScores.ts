import { Router } from "express";
import { db, gameScoresTable } from "@workspace/db";

const router = Router();

// Save game score
router.post("/game-scores", async (req, res) => {
  const body = { ...req.body };
  if (body.studentId) body.studentId = parseInt(body.studentId);
  if (body.score) body.score = parseInt(body.score);
  const [entry] = await db.insert(gameScoresTable).values(body).returning();
  res.status(201).json(entry);
});

// Get scores for a student
router.get("/game-scores", async (req, res) => {
  const { studentId } = req.query as Record<string, string>;
  let rows = await db.select().from(gameScoresTable);
  if (studentId) rows = rows.filter(r => r.studentId === parseInt(studentId));
  rows.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
  res.json(rows.map(r => ({ ...r, playedAt: r.playedAt.toISOString() })));
});

// Get top scores (leaderboard)
router.get("/game-scores/leaderboard", async (req, res) => {
  const { studentId } = req.query as Record<string, string>;
  let rows = await db.select().from(gameScoresTable);
  if (studentId) rows = rows.filter(r => r.studentId === parseInt(studentId));
  // Group by studentId and get best score
  const bestScores = new Map<number, { score: number; playedAt: Date }>();
  for (const r of rows) {
    const existing = bestScores.get(r.studentId);
    if (!existing || r.score > existing.score) {
      bestScores.set(r.studentId, { score: r.score, playedAt: r.playedAt });
    }
  }
  const result = Array.from(bestScores.entries())
    .map(([studentId, data]) => ({ studentId, score: data.score, playedAt: data.playedAt.toISOString() }))
    .sort((a, b) => b.score - a.score);
  res.json(result);
});

export default router;
