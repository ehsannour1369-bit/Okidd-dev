import { Router } from "express";
import { db, gradeLevelsTable, gradesTable, classesTable, classStudentsTable } from "@workspace/db";
import { eq, inArray, count } from "drizzle-orm";

const router = Router();

router.get("/grade-levels", async (req, res) => {
  const { branchId } = req.query as Record<string, string>;
  let rows = await db.select().from(gradeLevelsTable);
  if (branchId) rows = rows.filter(g => g.branchId === parseInt(branchId));

  const enriched = await Promise.all(rows.map(async gl => {
    const gradeRows = await db.select().from(gradesTable).where(eq(gradesTable.gradeLevelId, gl.id));
    const gradeIds = gradeRows.map(g => g.id);
    let studentCount = 0;
    if (gradeIds.length > 0) {
      const classRows = await db.select().from(classesTable).where(inArray(classesTable.gradeId, gradeIds));
      const classIds = classRows.map(c => c.id);
      if (classIds.length > 0) {
        const stu = await db.select({ count: count() }).from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds));
        studentCount = Number(stu[0]?.count ?? 0);
      }
    }
    return { ...gl, studentCount };
  }));
  res.json(enriched);
});

router.post("/grade-levels", async (req, res) => {
  const [row] = await db.insert(gradeLevelsTable).values(req.body).returning();
  res.status(201).json({ ...row, studentCount: 0 });
});

router.put("/grade-levels/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.update(gradeLevelsTable).set(req.body).where(eq(gradeLevelsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, studentCount: 0 });
});

router.delete("/grade-levels/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(gradeLevelsTable).where(eq(gradeLevelsTable.id, id));
  res.status(204).end();
});

export default router;
