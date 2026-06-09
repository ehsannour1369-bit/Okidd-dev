import { Router } from "express";
import { db, classSessionsTable, classStudentsTable, usersTable, classesTable, gradesTable, gradeLevelsTable, branchesTable, schoolsTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";

async function getSchoolConfig(classId: number): Promise<{ videoConferenceUrl: string | null; skyroomApiKey: string | null }> {
  const [cls] = await db.select({ gradeId: classesTable.gradeId }).from(classesTable).where(eq(classesTable.id, classId)).limit(1);
  if (!cls) return { videoConferenceUrl: null, skyroomApiKey: null };
  const [grade] = await db.select({ gradeLevelId: gradesTable.gradeLevelId }).from(gradesTable).where(eq(gradesTable.id, cls.gradeId)).limit(1);
  if (!grade) return { videoConferenceUrl: null, skyroomApiKey: null };
  const [gradeLevel] = await db.select({ branchId: gradeLevelsTable.branchId }).from(gradeLevelsTable).where(eq(gradeLevelsTable.id, grade.gradeLevelId)).limit(1);
  if (!gradeLevel) return { videoConferenceUrl: null, skyroomApiKey: null };
  const [branch] = await db.select({ schoolId: branchesTable.schoolId }).from(branchesTable).where(eq(branchesTable.id, gradeLevel.branchId)).limit(1);
  if (!branch) return { videoConferenceUrl: null, skyroomApiKey: null };
  const [school] = await db
    .select({ videoConferenceUrl: schoolsTable.videoConferenceUrl, skyroomApiKey: schoolsTable.skyroomApiKey })
    .from(schoolsTable)
    .where(eq(schoolsTable.id, branch.schoolId))
    .limit(1);
  return {
    videoConferenceUrl: school?.videoConferenceUrl ?? null,
    skyroomApiKey: school?.skyroomApiKey ?? null,
  };
}

// ─── Skyroom helpers ──────────────────────────────────────────────────────────

async function callSkyroom(apiKey: string, action: string, params: Record<string, unknown>): Promise<any> {
  const res = await fetch(`https://skyroom.online/api/${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  if (!res.ok) throw new Error(`Skyroom HTTP ${res.status}`);
  const data = await res.json() as { ok: boolean; result: any; error_code?: number; error_message?: string };
  if (!data.ok) throw new Error(data.error_message ?? `Skyroom error code ${data.error_code}`);
  return data.result;
}

async function createSkyroomSession(
  apiKey: string,
  roomCode: string,
  title: string,
): Promise<{ roomId: number; presenterUrl: string; attendeeUrl: string }> {
  const room = await callSkyroom(apiKey, "createRoom", {
    name: roomCode,
    title,
    guest_login: 1,
    max_users: 100,
    active: 1,
  }) as { id: number };

  const presenterUrl = await callSkyroom(apiKey, "getLoginUrl", {
    room_id: room.id,
    user_id: "teacher_okidd",
    user_fname: "معلم",
    user_lname: "",
    user_role: 1,
    language: "fa",
  }) as string;

  const attendeeUrl = await callSkyroom(apiKey, "getLoginUrl", {
    room_id: room.id,
    user_id: "student_okidd",
    user_fname: "دانش‌آموز",
    user_lname: "",
    user_role: 2,
    language: "fa",
  }) as string;

  return { roomId: room.id, presenterUrl, attendeeUrl };
}

// ─── Router ───────────────────────────────────────────────────────────────────

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

  const { videoConferenceUrl } = await getSchoolConfig(parseInt(classId));
  return res.json(rows.map(r => ({ ...r, teacherName: tMap[r.teacherId] ?? null, videoConferenceUrl })));
});

// GET /class-sessions/active-for-student?studentId=X
// Returns the first active session across ALL classes the student is enrolled in
router.get("/class-sessions/active-for-student", async (req, res) => {
  const { studentId } = req.query as Record<string, string>;
  if (!studentId) return res.status(400).json({ error: "studentId required" });

  const enrollments = await db
    .select({ classId: classStudentsTable.classId })
    .from(classStudentsTable)
    .where(eq(classStudentsTable.studentId, parseInt(studentId)));

  if (enrollments.length === 0) { res.json(null); return; }

  const classIds = enrollments.map(e => e.classId);
  const [row] = await db
    .select()
    .from(classSessionsTable)
    .where(and(
      inArray(classSessionsTable.classId, classIds),
      eq(classSessionsTable.status, "active"),
    ))
    .orderBy(desc(classSessionsTable.startedAt))
    .limit(1);

  if (!row) { res.json(null); return; }
  const { videoConferenceUrl } = await getSchoolConfig(row.classId);
  return res.json({ ...row, videoConferenceUrl });
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
  const { videoConferenceUrl } = await getSchoolConfig(parseInt(classId));
  return res.json({ ...row, videoConferenceUrl });
});

// POST /class-sessions — teacher starts a session
router.post("/class-sessions", async (req, res) => {
  const { classId, teacherId, title } = req.body;
  if (!classId || !teacherId || !title) {
    return res.status(400).json({ error: "classId, teacherId, title required" });
  }

  const [existing] = await db
    .select()
    .from(classSessionsTable)
    .where(and(
      eq(classSessionsTable.classId, Number(classId)),
      eq(classSessionsTable.status, "active"),
    ))
    .limit(1);

  if (existing) return res.status(409).json({ error: "کلاس آنلاین فعالی برای این کلاس وجود دارد" });

  const roomCode = `okidd-${classId}-${Date.now()}`;

  let skyroomRoomId: number | null = null;
  let skyroomPresenterUrl: string | null = null;
  let skyroomAttendeeUrl: string | null = null;

  const { skyroomApiKey } = await getSchoolConfig(Number(classId));
  if (skyroomApiKey) {
    try {
      const skyroom = await createSkyroomSession(skyroomApiKey, roomCode, title);
      skyroomRoomId = skyroom.roomId;
      skyroomPresenterUrl = skyroom.presenterUrl;
      skyroomAttendeeUrl = skyroom.attendeeUrl;
    } catch (err: any) {
      (req as any).log?.warn?.({ err: err?.message }, "Skyroom room creation failed, using URL fallback");
    }
  }

  const [row] = await db.insert(classSessionsTable).values({
    classId: Number(classId),
    teacherId: Number(teacherId),
    title,
    roomCode,
    status: "active",
    skyroomRoomId,
    skyroomPresenterUrl,
    skyroomAttendeeUrl,
    endedAt: null,
  }).returning();

  return res.status(201).json(row);
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
  return res.json(row);
});

export default router;
