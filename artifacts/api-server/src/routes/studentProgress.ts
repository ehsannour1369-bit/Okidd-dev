import { Router } from "express";
import { db, studentProgressTable, lessonUnlocksTable, presenceLogTable, usersTable, classesTable, classStudentsTable, gameScoresTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router = Router();

// Student progress
router.get("/student-progress", async (req, res) => {
  const { studentId, classId, bookId } = req.query as Record<string, string>;
  let rows = await db.select().from(studentProgressTable);
  if (studentId) rows = rows.filter(p => p.studentId === parseInt(studentId));
  if (classId) rows = rows.filter(p => p.classId === parseInt(classId));
  if (bookId) rows = rows.filter(p => p.bookId === parseInt(bookId));
  res.json(rows.map(p => ({ ...p, completedAt: p.completedAt ? p.completedAt.toISOString() : null })));
});

router.post("/student-progress", async (req, res) => {
  const [entry] = await db.insert(studentProgressTable).values(req.body).returning();
  res.status(201).json(entry);
});

router.put("/student-progress/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const updateData = { ...req.body };
  if (updateData.completed === true) updateData.completedAt = new Date();
  const [entry] = await db.update(studentProgressTable).set(updateData).where(eq(studentProgressTable.id, id)).returning();
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  res.json(entry);
});

// Lesson unlocks
router.get("/lesson-unlocks", async (req, res) => {
  const { classId, bookId } = req.query as Record<string, string>;
  let rows = await db.select().from(lessonUnlocksTable);
  if (classId) rows = rows.filter(u => u.classId === parseInt(classId));
  if (bookId) rows = rows.filter(u => u.bookId === parseInt(bookId));
  res.json(rows.map(u => ({ ...u, unlockedAt: u.unlockedAt ? u.unlockedAt.toISOString() : null })));
});

router.post("/lesson-unlocks", async (req, res) => {
  const [entry] = await db.insert(lessonUnlocksTable).values(req.body).returning();
  res.status(201).json(entry);
});

router.delete("/lesson-unlocks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(lessonUnlocksTable).where(eq(lessonUnlocksTable.id, id));
  res.status(204).end();
});

router.delete("/lesson-unlocks", async (req, res) => {
  const { classId, bookId, lessonId } = req.query as Record<string, string>;
  if (!classId || !bookId || !lessonId) { res.status(400).json({ error: "classId, bookId, lessonId required" }); return; }
  let rows = await db.select().from(lessonUnlocksTable);
  rows = rows.filter(u => u.classId === parseInt(classId) && u.bookId === parseInt(bookId) && u.lessonId === parseInt(lessonId));
  for (const row of rows) await db.delete(lessonUnlocksTable).where(eq(lessonUnlocksTable.id, row.id));
  res.status(204).end();
});

// Presence log
router.get("/presence-log", async (req, res) => {
  const { studentId, classId } = req.query as Record<string, string>;
  let rows = await db.select().from(presenceLogTable);
  if (studentId) rows = rows.filter(p => p.studentId === parseInt(studentId));
  if (classId) rows = rows.filter(p => p.classId === parseInt(classId));
  res.json(rows.map(p => ({
    ...p,
    enteredAt: p.enteredAt.toISOString(),
    exitedAt: p.exitedAt ? p.exitedAt.toISOString() : null,
  })));
});

router.post("/presence-log", async (req, res) => {
  const [entry] = await db.insert(presenceLogTable).values(req.body).returning();
  res.status(201).json(entry);
});

// Score breakdown by activity type for a student
router.get("/student-scores-breakdown", async (req, res) => {
  const { studentId } = req.query as Record<string, string>;
  if (!studentId) { res.status(400).json({ error: "studentId required" }); return; }
  const sid = parseInt(studentId);

  const [progress, gameScores] = await Promise.all([
    db.select().from(studentProgressTable).where(eq(studentProgressTable.studentId, sid)),
    db.select().from(gameScoresTable).where(eq(gameScoresTable.studentId, sid)),
  ]);

  const lessonScore = progress.filter(p => p.completed).reduce((sum, p) => sum + p.score, 0);

  const breakdown: Record<string, number> = {
    lesson: lessonScore,
    balloon: 0,
    animation: 0,
    video: 0,
    game: 0,
    quiz: 0,
    exercise: 0,
  };

  for (const gs of gameScores) {
    const type = gs.gameType;
    if (type in breakdown) breakdown[type] = (breakdown[type] ?? 0) + gs.score;
    else breakdown[type] = (breakdown[type] ?? 0) + gs.score;
  }

  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
  res.json({ ...breakdown, total });
});

// Rankings — supports classId, bookId, gradeId filters
router.get("/rankings", async (req, res) => {
  const { classId, bookId, gradeId } = req.query as Record<string, string>;

  let rows = await db.select().from(studentProgressTable);
  if (classId) rows = rows.filter(p => p.classId === parseInt(classId));
  if (bookId) rows = rows.filter(p => p.bookId === parseInt(bookId));

  // gradeId: find all students in classes of that grade
  if (gradeId) {
    const gradeClasses = await db.select({ id: classesTable.id })
      .from(classesTable)
      .where(eq(classesTable.gradeId, parseInt(gradeId)));
    const classIds = gradeClasses.map(c => c.id);
    if (classIds.length > 0) {
      const classStudents = await db.select({ studentId: classStudentsTable.studentId })
        .from(classStudentsTable)
        .where(inArray(classStudentsTable.classId, classIds));
      const studentIds = classStudents.map(s => s.studentId);
      rows = rows.filter(p => studentIds.includes(p.studentId));
    } else {
      rows = [];
    }
  }

  // Also include balloon / activity game scores in total
  const allGameScores = await db.select().from(gameScoresTable);

  const studentScores = new Map<number, number>();
  for (const r of rows) {
    studentScores.set(r.studentId, (studentScores.get(r.studentId) ?? 0) + r.score);
  }

  // Add game scores to total (scoped to same students found in progress)
  for (const gs of allGameScores) {
    if (studentScores.has(gs.studentId)) {
      studentScores.set(gs.studentId, studentScores.get(gs.studentId)! + gs.score);
    } else if (!classId && !bookId && !gradeId) {
      // Global ranking: include students who only have game scores
      studentScores.set(gs.studentId, (studentScores.get(gs.studentId) ?? 0) + gs.score);
    }
  }

  if (studentScores.size === 0) { res.json([]); return; }

  const studentIds = Array.from(studentScores.keys());
  const students = await db.select().from(usersTable).where(inArray(usersTable.id, studentIds));
  const studentMap = Object.fromEntries(students.map(s => [s.id, s.name]));

  const rankings = Array.from(studentScores.entries())
    .map(([sid, score]) => ({
      studentId: sid,
      studentName: studentMap[sid] ?? "Unknown",
      score,
      classId: classId ? parseInt(classId) : null,
      bookId: bookId ? parseInt(bookId) : null,
      gradeId: gradeId ? parseInt(gradeId) : null,
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  res.json(rankings);
});

export default router;
