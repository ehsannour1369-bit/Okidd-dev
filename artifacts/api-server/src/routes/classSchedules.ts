import { Router } from "express";
import { db, classSchedulesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET /class-schedules?classId=X
router.get("/class-schedules", async (req, res) => {
  const { classId } = req.query as Record<string, string>;
  if (!classId) return res.status(400).json({ error: "classId required" });

  const rows = await db
    .select()
    .from(classSchedulesTable)
    .where(eq(classSchedulesTable.classId, parseInt(classId)));

  // enrich with teacher names
  const teacherIds = [...new Set(rows.map(r => r.teacherId).filter(Boolean))] as number[];
  let teacherMap: Record<number, string> = {};
  if (teacherIds.length > 0) {
    const teachers = await db.select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.role, "teacher"));
    for (const t of teachers) teacherMap[t.id] = t.name;
  }

  const result = rows.map(r => ({ ...r, teacherName: r.teacherId ? teacherMap[r.teacherId] ?? null : null }));
  return res.json(result);
});

// POST /class-schedules
router.post("/class-schedules", async (req, res) => {
  const { classId, dayOfWeek, startTime, endTime, subject, teacherId, academicYear } = req.body;
  if (!classId || dayOfWeek === undefined || !startTime || !endTime || !subject) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const [row] = await db.insert(classSchedulesTable).values({
    classId: Number(classId),
    dayOfWeek: Number(dayOfWeek),
    startTime,
    endTime,
    subject,
    teacherId: teacherId ? Number(teacherId) : null,
    academicYear: academicYear ?? "1404",
  }).returning();

  return res.status(201).json(row);
});

// PUT /class-schedules/:id
router.put("/class-schedules/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { dayOfWeek, startTime, endTime, subject, teacherId, academicYear } = req.body;

  const [row] = await db.update(classSchedulesTable)
    .set({
      ...(dayOfWeek !== undefined && { dayOfWeek: Number(dayOfWeek) }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(subject && { subject }),
      ...(teacherId !== undefined && { teacherId: teacherId ? Number(teacherId) : null }),
      ...(academicYear && { academicYear }),
    })
    .where(eq(classSchedulesTable.id, id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(row);
});

// DELETE /class-schedules/:id
router.delete("/class-schedules/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(classSchedulesTable).where(eq(classSchedulesTable.id, id));
  res.json({ ok: true });
});

export default router;
