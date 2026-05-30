import { Router } from "express";
import { db, contentTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/content", async (req, res) => {
  const { lessonId, classId, bookId } = req.query as Record<string, string>;
  let rows = await db.select().from(contentTable);
  if (lessonId) rows = rows.filter(c => c.lessonId === parseInt(lessonId));
  if (classId) rows = rows.filter(c => c.classId === parseInt(classId));
  if (bookId) rows = rows.filter(c => c.bookId === parseInt(bookId));
  res.json(rows);
});

router.post("/content", async (req, res) => {
  const [content] = await db.insert(contentTable).values(req.body).returning();
  res.status(201).json(content);
});

router.put("/content/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [content] = await db.update(contentTable).set(req.body).where(eq(contentTable.id, id)).returning();
  if (!content) { res.status(404).json({ error: "Not found" }); return; }
  res.json(content);
});

router.delete("/content/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(contentTable).where(eq(contentTable.id, id));
  res.status(204).end();
});

export default router;
