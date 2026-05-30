import { Router } from "express";
import { db, branchesTable, gradeLevelsTable, gradesTable, classesTable, classStudentsTable } from "@workspace/db";
import { eq, inArray, count } from "drizzle-orm";

const router = Router();

router.get("/branches", async (req, res) => {
  const { schoolId } = req.query as Record<string, string>;
  let branches = await db.select().from(branchesTable);
  if (schoolId) branches = branches.filter(b => b.schoolId === parseInt(schoolId));

  const enriched = await Promise.all(branches.map(async branch => {
    const glRows = await db.select().from(gradeLevelsTable).where(eq(gradeLevelsTable.branchId, branch.id));
    const glIds = glRows.map(g => g.id);
    let studentCount = 0;
    if (glIds.length > 0) {
      const gradeRows = await db.select().from(gradesTable).where(inArray(gradesTable.gradeLevelId, glIds));
      const gradeIds = gradeRows.map(g => g.id);
      if (gradeIds.length > 0) {
        const classRows = await db.select().from(classesTable).where(inArray(classesTable.gradeId, gradeIds));
        const classIds = classRows.map(c => c.id);
        if (classIds.length > 0) {
          const stu = await db.select({ count: count() }).from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds));
          studentCount = Number(stu[0]?.count ?? 0);
        }
      }
    }
    return { ...branch, studentCount };
  }));
  res.json(enriched);
});

router.post("/branches", async (req, res) => {
  const [branch] = await db.insert(branchesTable).values(req.body).returning();
  res.status(201).json({ ...branch, studentCount: 0 });
});

router.put("/branches/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [branch] = await db.update(branchesTable).set(req.body).where(eq(branchesTable.id, id)).returning();
  if (!branch) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...branch, studentCount: 0 });
});

router.delete("/branches/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(branchesTable).where(eq(branchesTable.id, id));
  res.status(204).end();
});

export default router;
