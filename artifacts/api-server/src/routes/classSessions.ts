import { Router } from "express";
import { db, classSessionsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

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

  res.json(rows.map(r => ({ ...r, teacherName: tMap[r.teacherId] ?? null })));
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

  res.json(row ?? null);
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
