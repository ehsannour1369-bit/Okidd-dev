import { Router } from "express";
import { db, studentEnrollmentsTable, usersTable, schoolsTable, branchesTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";

const router = Router();

async function enrichEnrollment(e: typeof studentEnrollmentsTable.$inferSelect) {
  const [student] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone, nationalId: usersTable.nationalId, gender: usersTable.gender })
    .from(usersTable).where(eq(usersTable.id, e.studentId));
  const [school] = await db.select({ id: schoolsTable.id, name: schoolsTable.name })
    .from(schoolsTable).where(eq(schoolsTable.id, e.schoolId));
  const branch = e.branchId
    ? (await db.select({ id: branchesTable.id, name: branchesTable.name }).from(branchesTable).where(eq(branchesTable.id, e.branchId)))[0]
    : null;
  return { ...e, student: student ?? null, school: school ?? null, branch: branch ?? null };
}

// GET /student-enrollments — list with optional filters
router.get("/student-enrollments", async (req, res) => {
  const { schoolId, studentId, academicYear, activeOnly } = req.query as Record<string, string>;
  let rows = await db.select().from(studentEnrollmentsTable).orderBy(desc(studentEnrollmentsTable.createdAt));
  if (schoolId) rows = rows.filter(r => r.schoolId === parseInt(schoolId));
  if (studentId) rows = rows.filter(r => r.studentId === parseInt(studentId));
  if (academicYear) rows = rows.filter(r => r.academicYear === academicYear);
  if (activeOnly === "true") rows = rows.filter(r => r.isActive);
  res.json(await Promise.all(rows.map(enrichEnrollment)));
});

// GET /student-enrollments/:studentId/history — full history for one student
router.get("/student-enrollments/:studentId/history", async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const rows = await db.select().from(studentEnrollmentsTable)
    .where(eq(studentEnrollmentsTable.studentId, studentId))
    .orderBy(desc(studentEnrollmentsTable.createdAt));
  res.json(await Promise.all(rows.map(enrichEnrollment)));
});

// POST /student-enrollments — enroll or transfer a student
// Deactivates any existing active enrollment for the same student+year, then inserts new one.
// Also updates users.schoolId to reflect the new active school.
router.post("/student-enrollments", async (req, res) => {
  const { studentId, schoolId, branchId, academicYear, notes } = req.body as {
    studentId: number;
    schoolId: number;
    branchId?: number;
    academicYear: string;
    notes?: string;
  };

  if (!studentId || !schoolId || !academicYear) {
    res.status(400).json({ error: "studentId، schoolId و academicYear الزامی هستند" });
    return;
  }

  // Deactivate previous active enrollments for this student+year
  await db.update(studentEnrollmentsTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(studentEnrollmentsTable.studentId, studentId),
      eq(studentEnrollmentsTable.academicYear, academicYear),
      eq(studentEnrollmentsTable.isActive, true),
    ));

  // Insert new enrollment
  const [enrollment] = await db.insert(studentEnrollmentsTable).values({
    studentId,
    schoolId,
    branchId: branchId ?? null,
    academicYear,
    isActive: true,
    notes: notes ?? null,
  }).returning();

  // Keep users.schoolId in sync with the active school
  await db.update(usersTable)
    .set({ schoolId, updatedAt: new Date() })
    .where(eq(usersTable.id, studentId));

  res.status(201).json(await enrichEnrollment(enrollment));
});

// PATCH /student-enrollments/:id — update notes or deactivate
router.patch("/student-enrollments/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { isActive, notes } = req.body;
  const [updated] = await db.update(studentEnrollmentsTable)
    .set({ ...(isActive !== undefined ? { isActive } : {}), ...(notes !== undefined ? { notes } : {}), updatedAt: new Date() })
    .where(eq(studentEnrollmentsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "ثبت‌نام یافت نشد" }); return; }
  res.json(await enrichEnrollment(updated));
});

// DELETE /student-enrollments/:id — hard delete
router.delete("/student-enrollments/:id", async (req, res) => {
  await db.delete(studentEnrollmentsTable).where(eq(studentEnrollmentsTable.id, parseInt(req.params.id)));
  res.status(204).end();
});

// GET /students-by-year?schoolId=&academicYear= — students enrolled in a school for a given year
router.get("/students-by-year", async (req, res) => {
  const { schoolId, academicYear } = req.query as Record<string, string>;
  if (!schoolId || !academicYear) { res.status(400).json({ error: "schoolId و academicYear الزامی" }); return; }

  const enrollments = await db.select().from(studentEnrollmentsTable)
    .where(and(
      eq(studentEnrollmentsTable.schoolId, parseInt(schoolId)),
      eq(studentEnrollmentsTable.academicYear, academicYear),
      eq(studentEnrollmentsTable.isActive, true),
    ));

  if (enrollments.length === 0) { res.json([]); return; }

  const studentIds = enrollments.map(e => e.studentId);
  const students = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone, nationalId: usersTable.nationalId, gender: usersTable.gender, status: usersTable.status })
    .from(usersTable).where(inArray(usersTable.id, studentIds));

  const enrollMap = Object.fromEntries(enrollments.map(e => [e.studentId, e]));
  res.json(students.map(s => ({
    ...s,
    enrollment: enrollMap[s.id] ?? null,
  })));
});

export default router;
