import { Router } from "express";
import { db, progressChartTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/progress-chart", async (req, res) => {
  const { classId, bookId } = req.query as Record<string, string>;
  let rows = await db.select().from(progressChartTable);
  if (classId) rows = rows.filter(p => p.classId === parseInt(classId));
  if (bookId) rows = rows.filter(p => p.bookId === parseInt(bookId));
  res.json(rows);
});

router.post("/progress-chart", async (req, res) => {
  const [entry] = await db.insert(progressChartTable).values(req.body).returning();
  res.status(201).json(entry);
});

// Upsert: set date for a lesson (insert or update)
router.post("/progress-chart/upsert", async (req, res) => {
  const { classId, bookId, lessonId, teachDate } = req.body as {
    classId: number; bookId: number; lessonId: number; teachDate: string;
  };
  const [existing] = await db.select().from(progressChartTable).where(
    and(
      eq(progressChartTable.classId, classId),
      eq(progressChartTable.bookId, bookId),
      eq(progressChartTable.lessonId, lessonId),
    )
  );
  if (existing) {
    const [updated] = await db.update(progressChartTable)
      .set({ teachDate })
      .where(eq(progressChartTable.id, existing.id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(progressChartTable)
      .values({ classId, bookId, lessonId, teachDate })
      .returning();
    res.status(201).json(created);
  }
});

router.put("/progress-chart/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [entry] = await db.update(progressChartTable).set(req.body).where(eq(progressChartTable.id, id)).returning();
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  res.json(entry);
});

router.delete("/progress-chart/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(progressChartTable).where(eq(progressChartTable.id, id));
  res.status(204).end();
});

export default router;
