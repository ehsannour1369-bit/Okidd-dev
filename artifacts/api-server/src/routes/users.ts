import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, schoolsTable, classStudentsTable, classTeachersTable, classBooksTable, classesTable, gradesTable, gradeLevelsTable, branchesTable, booksTable, presenceLogTable, studentProgressTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router = Router();

router.get("/users", async (req, res) => {
  const { role, status, schoolId, parentId } = req.query as Record<string, string>;
  let rows = await db.select().from(usersTable);
  if (role) rows = rows.filter(u => u.role === role);
  if (status) rows = rows.filter(u => u.status === status);
  if (schoolId) rows = rows.filter(u => u.schoolId === parseInt(schoolId));
  if (parentId) rows = rows.filter(u => (u as any).parentId === parseInt(parentId));
  const schools = await db.select().from(schoolsTable);
  const schoolMap = Object.fromEntries(schools.map(s => [s.id, s.name]));
  res.json(rows.map(({ password: _pw, ...u }) => ({ ...u, schoolName: u.schoolId ? schoolMap[u.schoolId] : null })));
});

router.post("/users", async (req, res) => {
  const { password, ...rest } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ ...rest, password: hashed, status: "active" }).returning();
  const { password: _pw, ...safeUser } = user;
  res.status(201).json(safeUser);
});

router.get("/users/:id", async (req, res) => {
  if (req.params.id === "details") { res.status(400).json({ error: "Use /users/:id/details" }); return; }
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

router.put("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { password, ...rest } = req.body;
  const updateData: Record<string, unknown> = { ...rest };
  if (password) updateData.password = await bcrypt.hash(password, 10);
  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

router.patch("/users/:id/avatar", async (req, res) => {
  const id = parseInt(req.params.id);
  const { avatarUrl } = req.body;
  const [user] = await db.update(usersTable)
    .set({ avatarUrl: avatarUrl ?? null })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

router.delete("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).end();
});

router.patch("/users/:id/toggle-status", async (req, res) => {
  const id = parseInt(req.params.id);
  const [current] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }
  const newStatus = current.status === "active" ? "inactive" : "active";
  const [user] = await db.update(usersTable).set({ status: newStatus }).where(eq(usersTable.id, id)).returning();
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

router.put("/users/:id/teacher-classes", async (req, res) => {
  const teacherId = parseInt(req.params.id);
  const { classIds } = req.body as { classIds: number[] };
  await db.delete(classTeachersTable).where(eq(classTeachersTable.teacherId, teacherId));
  if (Array.isArray(classIds) && classIds.length > 0) {
    await db.insert(classTeachersTable).values(classIds.map(classId => ({ classId, teacherId })));
  }
  res.json({ ok: true });
});

// Enrolled books for a student
router.get("/users/:id/enrolled-books", async (req, res) => {
  const studentId = parseInt(req.params.id);
  const studentClasses = await db.select({ classId: classStudentsTable.classId }).from(classStudentsTable).where(eq(classStudentsTable.studentId, studentId));
  const classIds = studentClasses.map(sc => sc.classId);
  if (classIds.length === 0) { res.json([]); return; }

  const classBookRows = await db.select({ bookId: classBooksTable.bookId }).from(classBooksTable).where(inArray(classBooksTable.classId, classIds));
  const bookIds = [...new Set(classBookRows.map(cb => cb.bookId))];
  if (bookIds.length === 0) { res.json([]); return; }

  const booksData = await db.select().from(booksTable).where(inArray(booksTable.id, bookIds));
  const progress = await db.select().from(studentProgressTable).where(eq(studentProgressTable.studentId, studentId));
  const completedByBook: Record<number, number> = {};
  for (const p of progress) {
    if (p.completed && p.bookId) completedByBook[p.bookId] = (completedByBook[p.bookId] ?? 0) + 1;
  }

  res.json(booksData.map(b => ({
    ...b,
    monthlyFee: parseFloat(String(b.monthlyFee)),
    completedLessons: completedByBook[b.id] ?? 0,
  })));
});

// Teacher's schools (with classes)
router.get("/users/:id/teacher-schools", async (req, res) => {
  const teacherId = parseInt(req.params.id);
  const teacherClassRows = await db.select({ classId: classTeachersTable.classId }).from(classTeachersTable).where(eq(classTeachersTable.teacherId, teacherId));
  const classIds = teacherClassRows.map(tc => tc.classId);
  if (classIds.length === 0) { res.json([]); return; }

  const classes = await db.select().from(classesTable).where(inArray(classesTable.id, classIds));
  const gradeIds = [...new Set(classes.map(c => c.gradeId).filter(Boolean) as number[])];
  if (gradeIds.length === 0) { res.json([]); return; }

  const grades = await db.select().from(gradesTable).where(inArray(gradesTable.id, gradeIds));
  const glIds = [...new Set(grades.map(g => g.gradeLevelId).filter(Boolean) as number[])];
  if (glIds.length === 0) { res.json([]); return; }

  const gradeLevels = await db.select().from(gradeLevelsTable).where(inArray(gradeLevelsTable.id, glIds));
  const branchIds = [...new Set(gradeLevels.map(gl => gl.branchId).filter(Boolean) as number[])];
  if (branchIds.length === 0) { res.json([]); return; }

  const branches = await db.select().from(branchesTable).where(inArray(branchesTable.id, branchIds));
  const schoolIds = [...new Set(branches.map(b => b.schoolId).filter(Boolean) as number[])];
  if (schoolIds.length === 0) { res.json([]); return; }

  const schools = await db.select().from(schoolsTable).where(inArray(schoolsTable.id, schoolIds));

  const schoolClassMap: Record<number, any[]> = {};
  for (const cls of classes) {
    const grade = grades.find(g => g.id === cls.gradeId);
    if (!grade) continue;
    const gl = gradeLevels.find(g => g.id === grade.gradeLevelId);
    if (!gl) continue;
    const branch = branches.find(b => b.id === gl.branchId);
    if (!branch?.schoolId) continue;
    if (!schoolClassMap[branch.schoolId]) schoolClassMap[branch.schoolId] = [];
    schoolClassMap[branch.schoolId].push(cls);
  }

  res.json(schools.map(s => ({ ...s, classes: schoolClassMap[s.id] ?? [] })));
});

// Student summary for parent view
router.get("/users/:id/student-summary", async (req, res) => {
  const studentId = parseInt(req.params.id);
  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, studentId));
  if (!student) { res.status(404).json({ error: "Not found" }); return; }

  const studentClasses = await db.select({ classId: classStudentsTable.classId }).from(classStudentsTable).where(eq(classStudentsTable.studentId, studentId));
  const classIds = studentClasses.map(sc => sc.classId);
  let books: any[] = [];
  let classDetails: any[] = [];

  if (classIds.length > 0) {
    const clsData = await db.select().from(classesTable).where(inArray(classesTable.id, classIds));
    classDetails = clsData;

    const classBookRows = await db.select({ bookId: classBooksTable.bookId }).from(classBooksTable).where(inArray(classBooksTable.classId, classIds));
    const bookIds = [...new Set(classBookRows.map(cb => cb.bookId))];
    if (bookIds.length > 0) {
      const booksData = await db.select().from(booksTable).where(inArray(booksTable.id, bookIds));
      const progress = await db.select().from(studentProgressTable).where(eq(studentProgressTable.studentId, studentId));
      books = booksData.map(b => {
        const bookProg = progress.filter(p => p.bookId === b.id);
        const completedLessons = bookProg.filter(p => p.completed).length;
        const totalScore = bookProg.reduce((s, p) => s + (p.score ?? 0), 0);
        const lessons = Array.from({ length: b.lessonCount }, (_, i) => {
          const lp = bookProg.find(p => p.lessonId === i + 1);
          return { lessonId: i + 1, completed: lp?.completed ?? false, score: lp?.score ?? 0 };
        });
        return {
          ...b, monthlyFee: parseFloat(String(b.monthlyFee)),
          completedLessons, totalScore, lessons,
        };
      });
    }
  }

  const presenceRows = await db.select().from(presenceLogTable).where(eq(presenceLogTable.studentId, studentId));
  const totalMinutes = presenceRows.reduce((s, p) => s + (p.durationMinutes ?? 0), 0);
  const sorted = [...presenceRows].sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());
  const allProgress = await db.select().from(studentProgressTable).where(eq(studentProgressTable.studentId, studentId));
  const totalScore = allProgress.reduce((s, p) => s + (p.score ?? 0), 0);

  const { password: _pw, ...safeStudent } = student;
  res.json({
    ...safeStudent,
    books,
    classes: classDetails,
    totalMinutes,
    totalScore,
    lastActivity: sorted[0]?.enteredAt ? new Date(sorted[0].enteredAt).toISOString() : null,
    lastLoginAt: student.lastLoginAt ? new Date(student.lastLoginAt).toISOString() : null,
  });
});

// Full user details (admin view)
router.get("/users/:id/details", async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { password: _pw, ...safeUser } = user;

  let school = null;
  if (user.schoolId) {
    const [s] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, user.schoolId));
    school = s ?? null;
  }

  if (user.role === "student") {
    const studentClassRows = await db.select({ classId: classStudentsTable.classId }).from(classStudentsTable).where(eq(classStudentsTable.studentId, id));
    const classIds = studentClassRows.map(r => r.classId);
    let classes: any[] = [];
    let books: any[] = [];

    if (classIds.length > 0) {
      const clsData = await db.select().from(classesTable).where(inArray(classesTable.id, classIds));
      const gradeIds = [...new Set(clsData.map(c => c.gradeId).filter(Boolean) as number[])];
      let grades: any[] = [];
      let gradeLevels: any[] = [];
      let branches: any[] = [];
      if (gradeIds.length > 0) {
        grades = await db.select().from(gradesTable).where(inArray(gradesTable.id, gradeIds));
        const glIds = [...new Set(grades.map((g: any) => g.gradeLevelId).filter(Boolean))];
        if (glIds.length > 0) {
          gradeLevels = await db.select().from(gradeLevelsTable).where(inArray(gradeLevelsTable.id, glIds as number[]));
          const bIds = [...new Set(gradeLevels.map((gl: any) => gl.branchId).filter(Boolean))];
          if (bIds.length > 0) branches = await db.select().from(branchesTable).where(inArray(branchesTable.id, bIds as number[]));
        }
      }
      classes = clsData.map(cls => {
        const grade = grades.find((g: any) => g.id === cls.gradeId);
        const gl = grade ? gradeLevels.find((g: any) => g.id === grade.gradeLevelId) : null;
        const branch = gl ? branches.find((b: any) => b.id === gl.branchId) : null;
        return { ...cls, gradeName: grade?.name ?? null, gradeLevelName: gl?.name ?? null, branchName: branch?.name ?? null };
      });

      const classBookRows = await db.select({ bookId: classBooksTable.bookId }).from(classBooksTable).where(inArray(classBooksTable.classId, classIds));
      const bookIds = [...new Set(classBookRows.map(cb => cb.bookId))];
      if (bookIds.length > 0) {
        const booksData = await db.select().from(booksTable).where(inArray(booksTable.id, bookIds));
        const progress = await db.select().from(studentProgressTable).where(eq(studentProgressTable.studentId, id));
        books = booksData.map(b => {
          const bp = progress.filter(p => p.bookId === b.id);
          const completedLessons = bp.filter(p => p.completed).length;
          const totalScore = bp.reduce((s, p) => s + (p.score ?? 0), 0);
          return { ...b, monthlyFee: parseFloat(String(b.monthlyFee)), completedLessons, totalScore };
        });
      }
    }

    const presenceRows = await db.select().from(presenceLogTable).where(eq(presenceLogTable.studentId, id));
    const totalMinutes = presenceRows.reduce((s, p) => s + (p.durationMinutes ?? 0), 0);
    const sortedP = [...presenceRows].sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());
    const allProg = await db.select().from(studentProgressTable).where(eq(studentProgressTable.studentId, id));
    const totalScore = allProg.reduce((s, p) => s + (p.score ?? 0), 0);

    res.json({ ...safeUser, school, classes, books, totalMinutes, totalScore, lastActivity: sortedP[0]?.enteredAt ? new Date(sortedP[0].enteredAt).toISOString() : null });
    return;
  }

  if (user.role === "teacher") {
    const teacherClassRows = await db.select({ classId: classTeachersTable.classId }).from(classTeachersTable).where(eq(classTeachersTable.teacherId, id));
    const classIds = teacherClassRows.map(r => r.classId);
    const classes = classIds.length > 0 ? await db.select().from(classesTable).where(inArray(classesTable.id, classIds)) : [];
    res.json({ ...safeUser, school, classes });
    return;
  }

  if (user.role === "parent") {
    const children = await db.select().from(usersTable);
    const filteredChildren = children.filter(c => c.role === "student" && c.schoolId === user.schoolId);
    res.json({ ...safeUser, school, children: filteredChildren.map(({ password: _pw2, ...c }) => c) });
    return;
  }

  res.json({ ...safeUser, school });
});

export default router;
