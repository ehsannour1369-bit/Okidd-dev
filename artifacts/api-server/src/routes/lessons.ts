import { Router } from "express";
import { db, lessonsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/lessons", async (req, res) => {
  const { bookId } = req.query as Record<string, string>;
  let rows = await db.select().from(lessonsTable);
  if (bookId) rows = rows.filter(l => l.bookId === parseInt(bookId));
  rows.sort((a, b) => a.orderIndex - b.orderIndex);
  res.json(rows);
});

router.post("/lessons", async (req, res) => {
  const [lesson] = await db.insert(lessonsTable).values(req.body).returning();
  res.status(201).json(lesson);
});

router.put("/lessons/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [lesson] = await db.update(lessonsTable).set(req.body).where(eq(lessonsTable.id, id)).returning();
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }
  res.json(lesson);
});

router.delete("/lessons/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(lessonsTable).where(eq(lessonsTable.id, id));
  res.status(204).end();
});

export default router;
