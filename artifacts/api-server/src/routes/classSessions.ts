import { Router } from "express";
import { db, classSessionsTable, usersTable, classesTable, gradesTable, gradeLevelsTable, branchesTable, schoolsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

async function getSchoolVideoUrl(classId: number): Promise<string | null> {
  const [cls] = await db.select({ gradeId: classesTable.gradeId }).from(classesTable).where(eq(classesTable.id, classId)).limit(1);
  if (!cls) return null;
  const [grade] = await db.select({ gradeLevelId: gradesTable.gradeLevelId }).from(gradesTable).where(eq(gradesTable.id, cls.gradeId)).limit(1);
  if (!grade) return null;
  const [gradeLevel] = await db.select({ branchId: gradeLevelsTable.branchId }).from(gradeLevelsTable).where(eq(gradeLevelsTable.id, grade.gradeLevelId)).limit(1);
  if (!gradeLevel) return null;
  const [branch] = await db.select({ schoolId: branchesTable.schoolId }).from(branchesTable).where(eq(branchesTable.id, gradeLevel.branchId)).limit(1);
  if (!branch) return null;
  const [school] = await db.select({ videoConferenceUrl: schoolsTable.videoConferenceUrl }).from(schoolsTable).where(eq(schoolsTable.id, branch.schoolId)).limit(1);
  return school?.videoConferenceUrl ?? null;
}

const router = Router();

// GET /class-sessions?classId=X
router.get("/class-sessions", async (req, res) => {
  const { classId } = req.query as Record<string, string>;
  if (!classId) return res.status(400).json({ error: "classId required" });

  const rows = await db
    .select()
    .from(classSessionsTable)
    .where(eq(classSessionsTable.classId, parseInt(classId)))
    .orderBy(desc(classSessionsTable.startedAt));

  const teacherIds = [...new Set(rows.map(r => r.teacherId))];
  const teachers = teacherIds.length
    ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable)
    : [];
  const tMap = Object.fromEntries(teachers.map(t => [t.id, t.name]));

  const videoConferenceUrl = await getSchoolVideoUrl(parseInt(classId));
  res.json(rows.map(r => ({ ...r, teacherName: tMap[r.teacherId] ?? null, videoConferenceUrl })));
});

// GET /class-sessions/active?classId=X
router.get("/class-sessions/active", async (req, res) => {
  const { classId } = req.query as Record<string, string>;
  if (!classId) return res.status(400).json({ error: "classId required" });

  const [row] = await db
    .select()
    .from(classSessionsTable)
    .where(and(
      eq(classSessionsTable.classId, parseInt(classId)),
      eq(classSessionsTable.status, "active"),
    ))
    .orderBy(desc(classSessionsTable.startedAt))
    .limit(1);

  if (!row) { res.json(null); return; }
  const videoConferenceUrl = await getSchoolVideoUrl(parseInt(classId));
  res.json({ ...row, videoConferenceUrl });
});

// POST /class-sessions — teacher starts a session
router.post("/class-sessions", async (req, res) => {
  const { classId, teacherId, title } = req.body;
  if (!classId || !teacherId || !title) {
    return res.status(400).json({ error: "classId, teacherId, title required" });
  }

  // check for already-active session in this class
  const [existing] = await db
    .select()
    .from(classSessionsTable)
    .where(and(
      eq(classSessionsTable.classId, Number(classId)),
      eq(classSessionsTable.status, "active"),
    ))
    .limit(1);

  if (existing) return res.status(409).json({ error: "کلاس آنلاین فعالی برای این کلاس وجود دارد" });

  const roomCode = `okidd-class-${classId}-${Date.now()}`;

  const [row] = await db.insert(classSessionsTable).values({
    classId: Number(classId),
    teacherId: Number(teacherId),
    title,
    roomCode,
    status: "active",
    endedAt: null,
  }).returning();

  res.status(201).json(row);
});

// PATCH /class-sessions/:id/end
router.patch("/class-sessions/:id/end", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db
    .update(classSessionsTable)
    .set({ status: "ended", endedAt: new Date() })
    .where(eq(classSessionsTable.id, id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

export default router;
