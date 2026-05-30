import { Router } from "express";
import { db, studentProgressTable, lessonUnlocksTable, presenceLogTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

// Rankings
router.get("/rankings", async (req, res) => {
  const { classId, bookId } = req.query as Record<string, string>;
  let rows = await db.select().from(studentProgressTable);
  if (classId) rows = rows.filter(p => p.classId === parseInt(classId));
  if (bookId) rows = rows.filter(p => p.bookId === parseInt(bookId));

  const studentScores = new Map<number, number>();
  for (const r of rows) {
    studentScores.set(r.studentId, (studentScores.get(r.studentId) ?? 0) + r.score);
  }

  const studentIds = Array.from(studentScores.keys());
  const students = studentIds.length > 0 ? await db.select().from(usersTable) : [];
  const studentMap = Object.fromEntries(students.map(s => [s.id, s.name]));

  const rankings = Array.from(studentScores.entries())
    .map(([studentId, score]) => ({ studentId, studentName: studentMap[studentId] ?? "Unknown", score, classId: classId ? parseInt(classId) : null, bookId: bookId ? parseInt(bookId) : null }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  res.json(rankings);
});

export default router;
