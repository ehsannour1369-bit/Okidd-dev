import { Router } from "express";
import { db, classesTable, classStudentsTable, classTeachersTable, classBooksTable, usersTable, booksTable, gradesTable, gradeLevelsTable, branchesTable, schoolsTable, presenceLogTable, studentProgressTable, bookOrdersTable, bookOrderItemsTable } from "@workspace/db";
import { eq, inArray, count, and, sum } from "drizzle-orm";

const router = Router();

/* ─── License helpers ─────────────────────────────────────────────────── */

/** Resolve schoolId for a classId (class → grade → gradeLevel → branch → school) */
async function getSchoolIdForClass(classId: number): Promise<number | null> {
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls?.gradeId) return null;
  const [grade] = await db.select().from(gradesTable).where(eq(gradesTable.id, cls.gradeId));
  if (!grade?.gradeLevelId) return null;
  const [gl] = await db.select().from(gradeLevelsTable).where(eq(gradeLevelsTable.id, grade.gradeLevelId));
  if (!gl?.branchId) return null;
  const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, gl.branchId));
  return branch?.schoolId ?? null;
}

/** Count purchased licenses for a book in a school (from paid book orders) */
async function getPurchasedCount(schoolId: number, bookId: number): Promise<number> {
  const paidOrders = await db.select({ id: bookOrdersTable.id })
    .from(bookOrdersTable)
    .where(and(eq(bookOrdersTable.schoolId, schoolId), eq(bookOrdersTable.status, "paid")));
  if (paidOrders.length === 0) return 0;
  const paidOrderIds = paidOrders.map(o => o.id);
  const result = await db.select({ total: sum(bookOrderItemsTable.quantity) })
    .from(bookOrderItemsTable)
    .where(and(inArray(bookOrderItemsTable.orderId, paidOrderIds), eq(bookOrderItemsTable.bookId, bookId)));
  return Number(result[0]?.total ?? 0);
}

/** Count currently used licenses for a book in a school (distinct students in classes with this book) */
async function getUsedCount(schoolId: number, bookId: number): Promise<number> {
  const branches = await db.select({ id: branchesTable.id }).from(branchesTable).where(eq(branchesTable.schoolId, schoolId));
  if (branches.length === 0) return 0;
  const branchIds = branches.map(b => b.id);
  const gls = await db.select({ id: gradeLevelsTable.id }).from(gradeLevelsTable).where(inArray(gradeLevelsTable.branchId, branchIds));
  if (gls.length === 0) return 0;
  const glIds = gls.map(g => g.id);
  const grades = await db.select({ id: gradesTable.id }).from(gradesTable).where(inArray(gradesTable.gradeLevelId, glIds));
  if (grades.length === 0) return 0;
  const gradeIds = grades.map(g => g.id);
  const classes = await db.select({ id: classesTable.id }).from(classesTable).where(inArray(classesTable.gradeId, gradeIds));
  if (classes.length === 0) return 0;
  const classIds = classes.map(c => c.id);
  const cbRows = await db.select({ classId: classBooksTable.classId }).from(classBooksTable)
    .where(and(inArray(classBooksTable.classId, classIds), eq(classBooksTable.bookId, bookId)));
  const bookClassIds = cbRows.map(r => r.classId);
  if (bookClassIds.length === 0) return 0;
  const studs = await db.select({ studentId: classStudentsTable.studentId }).from(classStudentsTable)
    .where(inArray(classStudentsTable.classId, bookClassIds));
  return new Set(studs.map(s => s.studentId)).size;
}

router.get("/classes", async (req, res) => {
  const { gradeId, teacherId, studentId, schoolId, branchId } = req.query as Record<string, string>;
  let rows = await db.select().from(classesTable);
  if (gradeId) rows = rows.filter(c => c.gradeId === parseInt(gradeId));

  if (teacherId) {
    const teacherClasses = await db.select({ classId: classTeachersTable.classId }).from(classTeachersTable).where(eq(classTeachersTable.teacherId, parseInt(teacherId)));
    const ids = teacherClasses.map(tc => tc.classId);
    rows = rows.filter(c => ids.includes(c.id));
  }

  if (studentId) {
    const studentClasses = await db.select({ classId: classStudentsTable.classId }).from(classStudentsTable).where(eq(classStudentsTable.studentId, parseInt(studentId)));
    const ids = studentClasses.map(sc => sc.classId);
    rows = rows.filter(c => ids.includes(c.id));
  }

  if (schoolId || branchId) {
    const sid = schoolId ? parseInt(schoolId) : null;
    const bid = branchId ? parseInt(branchId) : null;
    const branches = bid
      ? [{ id: bid }]
      : await db.select({ id: branchesTable.id }).from(branchesTable).where(eq(branchesTable.schoolId, sid!));
    const branchIds = branches.map(b => b.id);
    const gls = branchIds.length > 0
      ? await db.select({ id: gradeLevelsTable.id }).from(gradeLevelsTable).where(inArray(gradeLevelsTable.branchId, branchIds))
      : [];
    const glIds = gls.map(g => g.id);
    const grades = glIds.length > 0
      ? await db.select({ id: gradesTable.id }).from(gradesTable).where(inArray(gradesTable.gradeLevelId, glIds))
      : [];
    const gradeIds = grades.map(g => g.id);
    rows = gradeIds.length > 0 ? rows.filter(c => gradeIds.includes(c.gradeId)) : [];
  }

  const enriched = await Promise.all(rows.map(async cls => {
    const [stu, tea] = await Promise.all([
      db.select({ count: count() }).from(classStudentsTable).where(eq(classStudentsTable.classId, cls.id)),
      db.select({ count: count() }).from(classTeachersTable).where(eq(classTeachersTable.classId, cls.id)),
    ]);
    return { ...cls, studentCount: Number(stu[0]?.count ?? 0), teacherCount: Number(tea[0]?.count ?? 0) };
  }));
  res.json(enriched);
});

router.post("/classes", async (req, res) => {
  const [cls] = await db.insert(classesTable).values(req.body).returning();
  res.status(201).json({ ...cls, studentCount: 0, teacherCount: 0 });
});

router.get("/classes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, id));
  if (!cls) { res.status(404).json({ error: "Not found" }); return; }
  const [stu, tea] = await Promise.all([
    db.select({ count: count() }).from(classStudentsTable).where(eq(classStudentsTable.classId, id)),
    db.select({ count: count() }).from(classTeachersTable).where(eq(classTeachersTable.classId, id)),
  ]);
  res.json({ ...cls, studentCount: Number(stu[0]?.count ?? 0), teacherCount: Number(tea[0]?.count ?? 0) });
});

router.put("/classes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [cls] = await db.update(classesTable).set(req.body).where(eq(classesTable.id, id)).returning();
  if (!cls) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...cls, studentCount: 0, teacherCount: 0 });
});

router.delete("/classes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(classesTable).where(eq(classesTable.id, id));
  res.status(204).end();
});

// Students
router.get("/classes/:id/students", async (req, res) => {
  const classId = parseInt(req.params.id);
  const rows = await db.select({ studentId: classStudentsTable.studentId }).from(classStudentsTable).where(eq(classStudentsTable.classId, classId));
  const studentIds = rows.map(r => r.studentId);
  if (studentIds.length === 0) { res.json([]); return; }
  const students = await db.select().from(usersTable).where(inArray(usersTable.id, studentIds));
  res.json(students.map(({ password: _pw, ...u }) => u));
});

router.post("/classes/:id/students", async (req, res) => {
  const classId = parseInt(req.params.id);
  const { studentId } = req.body;

  // License check: adding a student "uses" one license for each book in this class
  const schoolId = await getSchoolIdForClass(classId);
  if (schoolId) {
    const bookRows = await db.select({ bookId: classBooksTable.bookId }).from(classBooksTable).where(eq(classBooksTable.classId, classId));
    const violations: string[] = [];
    for (const { bookId } of bookRows) {
      const [purchased, used] = await Promise.all([getPurchasedCount(schoolId, bookId), getUsedCount(schoolId, bookId)]);
      if (used >= purchased) {
        const [book] = await db.select({ title: booksTable.title }).from(booksTable).where(eq(booksTable.id, bookId));
        violations.push(`${book?.title ?? `کتاب #${bookId}`} (خریداری‌شده: ${purchased}، در حال استفاده: ${used})`);
      }
    }
    if (violations.length > 0) {
      res.status(400).json({ error: `مجوز کافی برای کتاب‌های زیر وجود ندارد: ${violations.join("، ")}. برای افزودن دانش‌آموز ابتدا مجوز بیشتری خریداری کنید.` });
      return;
    }
  }

  await db.insert(classStudentsTable).values({ classId, studentId }).onConflictDoNothing();
  res.status(201).json({ ok: true });
});

router.delete("/classes/:id/students/:studentId", async (req, res) => {
  const classId = parseInt(req.params.id);
  const studentId = parseInt(req.params.studentId);
  await db.delete(classStudentsTable).where(and(eq(classStudentsTable.classId, classId), eq(classStudentsTable.studentId, studentId)));
  res.status(204).end();
});

// Teachers
router.get("/classes/:id/teachers", async (req, res) => {
  const classId = parseInt(req.params.id);
  const rows = await db.select().from(classTeachersTable).where(eq(classTeachersTable.classId, classId));
  if (rows.length === 0) { res.json([]); return; }
  const teacherIds = [...new Set(rows.map(r => r.teacherId))];
  const bookIds = [...new Set(rows.map(r => r.bookId).filter((b): b is number => b != null))];
  const [teachers, books] = await Promise.all([
    db.select().from(usersTable).where(inArray(usersTable.id, teacherIds)),
    bookIds.length > 0 ? db.select().from(booksTable).where(inArray(booksTable.id, bookIds)) : Promise.resolve([]),
  ]);
  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const bookMap = new Map((books as any[]).map((b: any) => [b.id, b]));
  res.json(rows.map(row => {
    const t = teacherMap.get(row.teacherId);
    const book = row.bookId ? bookMap.get(row.bookId) : null;
    if (!t) return null;
    const { password: _pw, ...safeT } = t;
    return { assignmentId: row.id, classId: row.classId, teacherId: row.teacherId, bookId: row.bookId ?? null, bookTitle: (book as any)?.title ?? null, ...safeT };
  }).filter(Boolean));
});

router.post("/classes/:id/teachers", async (req, res) => {
  const classId = parseInt(req.params.id);
  const { teacherId, bookId } = req.body;
  const [row] = await db.insert(classTeachersTable).values({ classId, teacherId, bookId: bookId ?? null }).returning();
  res.status(201).json(row);
});

// Delete a specific teacher assignment by assignmentId, bookId, or all for a teacher
router.delete("/classes/:id/teachers/:teacherId", async (req, res) => {
  const classId = parseInt(req.params.id);
  const teacherId = parseInt(req.params.teacherId);
  const assignmentId = req.query.assignmentId ? parseInt(req.query.assignmentId as string) : null;
  const bookId = req.query.bookId ? parseInt(req.query.bookId as string) : null;
  if (assignmentId) {
    await db.delete(classTeachersTable).where(and(eq(classTeachersTable.classId, classId), eq(classTeachersTable.id, assignmentId)));
  } else if (bookId) {
    await db.delete(classTeachersTable).where(and(eq(classTeachersTable.classId, classId), eq(classTeachersTable.teacherId, teacherId), eq(classTeachersTable.bookId, bookId)));
  } else {
    await db.delete(classTeachersTable).where(and(eq(classTeachersTable.classId, classId), eq(classTeachersTable.teacherId, teacherId)));
  }
  res.status(204).end();
});

// Books
router.get("/classes/:id/books", async (req, res) => {
  const classId = parseInt(req.params.id);
  const rows = await db.select({ bookId: classBooksTable.bookId }).from(classBooksTable).where(eq(classBooksTable.classId, classId));
  const bookIds = rows.map(r => r.bookId);
  if (bookIds.length === 0) { res.json([]); return; }
  const books = await db.select().from(booksTable).where(inArray(booksTable.id, bookIds));
  res.json(books.map(b => ({ ...b, monthlyFee: parseFloat(String(b.monthlyFee)) })));
});

router.post("/classes/:id/books", async (req, res) => {
  const classId = parseInt(req.params.id);
  const { bookId } = req.body;

  // License check: adding a book to a class "uses" N licenses (N = students currently in class)
  const schoolId = await getSchoolIdForClass(classId);
  if (schoolId) {
    const [purchased, used, studs] = await Promise.all([
      getPurchasedCount(schoolId, bookId),
      getUsedCount(schoolId, bookId),
      db.select({ count: count() }).from(classStudentsTable).where(eq(classStudentsTable.classId, classId)),
    ]);
    const classStudentCount = Number(studs[0]?.count ?? 0);
    const remaining = Math.max(0, purchased - used);
    if (used + classStudentCount > purchased) {
      const [book] = await db.select({ title: booksTable.title }).from(booksTable).where(eq(booksTable.id, bookId));
      res.status(400).json({
        error: `مجوز کافی برای کتاب «${book?.title ?? bookId}» وجود ندارد. خریداری‌شده: ${purchased}، در حال استفاده: ${used}، باقی‌مانده: ${remaining}، نیاز دارد: ${classStudentCount}`,
        purchased, used, remaining, required: classStudentCount,
      });
      return;
    }
  }

  await db.insert(classBooksTable).values({ classId, bookId }).onConflictDoNothing();
  res.status(201).json({ ok: true });
});

router.delete("/classes/:id/books/:bookId", async (req, res) => {
  const classId = parseInt(req.params.id);
  const bookId = parseInt(req.params.bookId);
  await db.delete(classBooksTable).where(and(eq(classBooksTable.classId, classId), eq(classBooksTable.bookId, bookId)));
  res.status(204).end();
});

// Get school info for a class by traversing the chain
router.get("/classes/:id/school", async (req, res) => {
  const id = parseInt(req.params.id);
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, id));
  if (!cls?.gradeId) { res.json(null); return; }
  const [grade] = await db.select().from(gradesTable).where(eq(gradesTable.id, cls.gradeId));
  if (!grade?.gradeLevelId) { res.json(null); return; }
  const [gl] = await db.select().from(gradeLevelsTable).where(eq(gradeLevelsTable.id, grade.gradeLevelId));
  if (!gl?.branchId) { res.json(null); return; }
  const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, gl.branchId));
  if (!branch?.schoolId) { res.json(null); return; }
  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, branch.schoolId));
  res.json(school ?? null);
});

// Performance: per-student stats for a class
router.get("/classes/:id/performance", async (req, res) => {
  const classId = parseInt(req.params.id);
  const studentRows = await db.select({ studentId: classStudentsTable.studentId }).from(classStudentsTable).where(eq(classStudentsTable.classId, classId));
  const studentIds = studentRows.map(r => r.studentId);
  if (studentIds.length === 0) { res.json([]); return; }

  const bookRows = await db.select({ bookId: classBooksTable.bookId }).from(classBooksTable).where(eq(classBooksTable.classId, classId));
  const bookIds = bookRows.map(r => r.bookId);

  const [students, books, allPresence, allProgress] = await Promise.all([
    db.select().from(usersTable).where(inArray(usersTable.id, studentIds)),
    bookIds.length > 0 ? db.select().from(booksTable).where(inArray(booksTable.id, bookIds)) : Promise.resolve([]),
    db.select().from(presenceLogTable),
    db.select().from(studentProgressTable),
  ]);

  const result = students.map(({ password: _pw, ...s }) => {
    const sp = allPresence.filter(p => p.studentId === s.id);
    const sorted = [...sp].sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());
    const totalMinutes = sp.reduce((sum, p) => sum + (p.durationMinutes ?? 0), 0);
    const prog = allProgress.filter(p => p.studentId === s.id);
    const totalScore = prog.reduce((sum, p) => sum + (p.score ?? 0), 0);
    const bookProgress = books.map(book => {
      const bp = prog.filter(p => p.bookId === book.id);
      const completed = bp.filter(p => p.completed).length;
      const score = bp.reduce((sum, p) => sum + (p.score ?? 0), 0);
      return { bookId: book.id, bookTitle: book.title, lessonCount: book.lessonCount, completedLessons: completed, score };
    });
    return {
      ...s,
      lastPresenceAt: sorted[0]?.enteredAt ? new Date(sorted[0].enteredAt).toISOString() : null,
      totalMinutesInApp: totalMinutes,
      totalScore,
      bookProgress,
    };
  });
  res.json(result);
});

export default router;
