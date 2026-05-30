import { Router } from "express";
import { db, schoolsTable, branchesTable, classStudentsTable, classTeachersTable, gradesTable, gradeLevelsTable, classesTable } from "@workspace/db";
import { eq, count, inArray } from "drizzle-orm";

const router = Router();

async function getSchoolCounts(schoolId: number) {
  const branches = await db.select().from(branchesTable).where(eq(branchesTable.schoolId, schoolId));
  const branchIds = branches.map(b => b.id);
  let studentCount = 0, teacherCount = 0;
  if (branchIds.length > 0) {
    const glRows = await db.select().from(gradeLevelsTable).where(inArray(gradeLevelsTable.branchId, branchIds));
    const glIds = glRows.map(g => g.id);
    if (glIds.length > 0) {
      const gradeRows = await db.select().from(gradesTable).where(inArray(gradesTable.gradeLevelId, glIds));
      const gradeIds = gradeRows.map(g => g.id);
      if (gradeIds.length > 0) {
        const classRows = await db.select().from(classesTable).where(inArray(classesTable.gradeId, gradeIds));
        const classIds = classRows.map(c => c.id);
        if (classIds.length > 0) {
          const stu = await db.select({ count: count() }).from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds));
          const tea = await db.select({ count: count() }).from(classTeachersTable).where(inArray(classTeachersTable.classId, classIds));
          studentCount = Number(stu[0]?.count ?? 0);
          teacherCount = Number(tea[0]?.count ?? 0);
        }
      }
    }
  }
  return { branchCount: branches.length, studentCount, teacherCount };
}

router.get("/schools", async (req, res) => {
  const schools = await db.select().from(schoolsTable);
  const enriched = await Promise.all(schools.map(async s => ({ ...s, ...(await getSchoolCounts(s.id)) })));
  res.json(enriched);
});

router.post("/schools", async (req, res) => {
  const [school] = await db.insert(schoolsTable).values(req.body).returning();
  res.status(201).json({ ...school, branchCount: 0, studentCount: 0, teacherCount: 0 });
});

router.get("/schools/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, id));
  if (!school) { res.status(404).json({ error: "Not found" }); return; }
  const counts = await getSchoolCounts(id);
  res.json({ ...school, ...counts });
});

router.put("/schools/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [school] = await db.update(schoolsTable).set(req.body).where(eq(schoolsTable.id, id)).returning();
  if (!school) { res.status(404).json({ error: "Not found" }); return; }
  const counts = await getSchoolCounts(id);
  res.json({ ...school, ...counts });
});

router.patch("/schools/:id/toggle-status", async (req, res) => {
  const id = parseInt(req.params.id);
  const [current] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, id));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }
  const newStatus = current.status === "active" ? "inactive" : "active";
  const [school] = await db.update(schoolsTable).set({ status: newStatus }).where(eq(schoolsTable.id, id)).returning();
  const counts = await getSchoolCounts(id);
  res.json({ ...school, ...counts });
});

export default router;
