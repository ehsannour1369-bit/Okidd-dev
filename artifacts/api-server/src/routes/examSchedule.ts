import { Router } from "express";
import { db, examScheduleTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/exam-schedule", async (req, res) => {
  const { schoolId, classId } = req.query as Record<string, string>;
  let rows = await db.select().from(examScheduleTable);
  if (schoolId) rows = rows.filter(e => e.schoolId === parseInt(schoolId));
  if (classId) rows = rows.filter(e => e.classId === parseInt(classId));
  res.json(rows);
});

router.post("/exam-schedule", async (req, res) => {
  const [entry] = await db.insert(examScheduleTable).values(req.body).returning();
  res.status(201).json(entry);
});

router.put("/exam-schedule/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [entry] = await db.update(examScheduleTable).set(req.body).where(eq(examScheduleTable.id, id)).returning();
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  res.json(entry);
});

router.delete("/exam-schedule/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(examScheduleTable).where(eq(examScheduleTable.id, id));
  res.status(204).end();
});

export default router;
