import { Router } from "express";
import { db, gradesTable, classesTable, classStudentsTable } from "@workspace/db";
import { eq, inArray, count } from "drizzle-orm";

const router = Router();

router.get("/grades", async (req, res) => {
  const { gradeLevelId } = req.query as Record<string, string>;
  let rows = await db.select().from(gradesTable);
  if (gradeLevelId) rows = rows.filter(g => g.gradeLevelId === parseInt(gradeLevelId));

  const enriched = await Promise.all(rows.map(async grade => {
    const classRows = await db.select().from(classesTable).where(eq(classesTable.gradeId, grade.id));
    const classIds = classRows.map(c => c.id);
    let studentCount = 0;
    if (classIds.length > 0) {
      const stu = await db.select({ count: count() }).from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds));
      studentCount = Number(stu[0]?.count ?? 0);
    }
    return { ...grade, studentCount };
  }));
  res.json(enriched);
});

router.post("/grades", async (req, res) => {
  const [row] = await db.insert(gradesTable).values(req.body).returning();
  res.status(201).json({ ...row, studentCount: 0 });
});

router.put("/grades/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.update(gradesTable).set(req.body).where(eq(gradesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, studentCount: 0 });
});

router.delete("/grades/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(gradesTable).where(eq(gradesTable.id, id));
  res.status(204).end();
});

export default router;
