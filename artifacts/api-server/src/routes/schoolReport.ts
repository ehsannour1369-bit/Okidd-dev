import { Router } from "express";
import { db, usersTable, branchesTable, gradeLevelsTable, gradesTable, classesTable, classTeachersTable, classStudentsTable, classBooksTable, booksTable, lessonsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { presenceLogTable, studentProgressTable } from "@workspace/db";

const router = Router();

async function getSchoolClassIds(schoolId: number): Promise<number[]> {
  const classes = await getSchoolClasses(schoolId);
  return classes.map(c => c.id);
}

async function getSchoolClasses(schoolId: number) {
  const branches = await db.select({ id: branchesTable.id }).from(branchesTable).where(eq(branchesTable.schoolId, schoolId));
  if (!branches.length) return [];
  const glRows = await db.select({ id: gradeLevelsTable.id }).from(gradeLevelsTable).where(inArray(gradeLevelsTable.branchId, branches.map(b => b.id)));
  if (!glRows.length) return [];
  const gradeRows = await db.select({ id: gradesTable.id }).from(gradesTable).where(inArray(gradesTable.gradeLevelId, glRows.map(g => g.id)));
  if (!gradeRows.length) return [];
  return db.select().from(classesTable).where(inArray(classesTable.gradeId, gradeRows.map(g => g.id)));
}

async function getBranchClassIds(branchId: number): Promise<number[]> {
  const glRows = await db.select({ id: gradeLevelsTable.id }).from(gradeLevelsTable).where(eq(gradeLevelsTable.branchId, branchId));
  if (!glRows.length) return [];
  const gradeRows = await db.select({ id: gradesTable.id }).from(gradesTable).where(inArray(gradesTable.gradeLevelId, glRows.map(g => g.id)));
  if (!gradeRows.length) return [];
  const classes = await db.select({ id: classesTable.id }).from(classesTable).where(inArray(classesTable.gradeId, gradeRows.map(g => g.id)));
  return classes.map(c => c.id);
}

router.get("/school-classes", async (req, res) => {
  const { schoolId } = req.query as Record<string, string>;
  if (!schoolId) { res.status(400).json({ error: "schoolId required" }); return; }
  const classes = await getSchoolClasses(parseInt(schoolId));
  res.json(classes);
});

router.get("/school-report/teachers", async (req, res) => {
  const { schoolId, branchId } = req.query as Record<string, string>;
  let classIds: number[];
  if (branchId) {
    classIds = await getBranchClassIds(parseInt(branchId));
  } else if (schoolId) {
    classIds = await getSchoolClassIds(parseInt(schoolId));
  } else {
    res.status(400).json({ error: "schoolId or branchId required" }); return;
  }
  if (!classIds.length) { res.json([]); return; }

  const teacherRows = await db
    .select({ teacherId: classTeachersTable.teacherId, classId: classTeachersTable.classId })
    .from(classTeachersTable)
    .where(inArray(classTeachersTable.classId, classIds));

  const uniqueTeacherIds = [...new Set(teacherRows.map(r => r.teacherId))];
  if (!uniqueTeacherIds.length) { res.json([]); return; }

  const [teachers, allClasses, studentRows, allBookIds] = await Promise.all([
    db.select().from(usersTable).where(inArray(usersTable.id, uniqueTeacherIds)),
    db.select({ id: classesTable.id, name: classesTable.name }).from(classesTable).where(inArray(classesTable.id, classIds)),
    db.select({ studentId: classStudentsTable.studentId, classId: classStudentsTable.classId }).from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds)),
    db.select({ bookId: classBooksTable.bookId, classId: classBooksTable.classId }).from(classBooksTable).where(inArray(classBooksTable.classId, classIds)),
  ]);

  const teacherClassMap: Record<number, number[]> = {};
  for (const r of teacherRows) {
    if (!teacherClassMap[r.teacherId]) teacherClassMap[r.teacherId] = [];
    if (!teacherClassMap[r.teacherId].includes(r.classId)) teacherClassMap[r.teacherId].push(r.classId);
  }

  const classNameMap: Record<number, string> = {};
  for (const c of allClasses) classNameMap[c.id] = c.name;

  // students per class
  const classStudentMap: Record<number, number[]> = {};
  for (const r of studentRows) {
    if (!classStudentMap[r.classId]) classStudentMap[r.classId] = [];
    classStudentMap[r.classId].push(r.studentId);
  }

  // books per class (for lesson counts)
  const classBookMap: Record<number, number[]> = {};
  for (const r of allBookIds) {
    if (!classBookMap[r.classId]) classBookMap[r.classId] = [];
    classBookMap[r.classId].push(r.bookId);
  }

  // fetch student performance if there are students
  const allStudentIds = studentRows.map(r => r.studentId);
  const uniqueStudentIds = [...new Set(allStudentIds)];

  let progressRows: { studentId: number; lessonId: number | null; bookId: number | null; score: number | null; completed: boolean | null }[] = [];
  if (uniqueStudentIds.length > 0) {
    progressRows = await db
      .select({ studentId: studentProgressTable.studentId, lessonId: studentProgressTable.lessonId, bookId: studentProgressTable.bookId, score: studentProgressTable.score, completed: studentProgressTable.completed })
      .from(studentProgressTable)
      .where(inArray(studentProgressTable.studentId, uniqueStudentIds));
  }

  const uniqueBookIds = [...new Set(allBookIds.map(r => r.bookId))];
  let bookLessonMap: Record<number, number> = {};
  let bookTitleMap: Record<number, string> = {};
  if (uniqueBookIds.length > 0) {
    const books = await db.select({ id: booksTable.id, title: booksTable.title, lessonCount: booksTable.lessonCount }).from(booksTable).where(inArray(booksTable.id, uniqueBookIds));
    for (const b of books) {
      bookLessonMap[b.id] = b.lessonCount ?? 0;
      bookTitleMap[b.id] = b.title;
    }
  }

  const result = teachers.map(({ password: _pw, ...t }) => {
    const tClassIds = teacherClassMap[t.id] ?? [];
    const tStudentIds = [...new Set(tClassIds.flatMap(cid => classStudentMap[cid] ?? []))];
    const tBookIds = [...new Set(tClassIds.flatMap(cid => classBookMap[cid] ?? []))];

    let totalScore = 0;
    let totalCompleted = 0;
    let totalLessons = 0;

    for (const sid of tStudentIds) {
      const sp = progressRows.filter(p => p.studentId === sid && p.bookId !== null && tBookIds.includes(p.bookId));
      totalScore += sp.reduce((s, p) => s + (p.score ?? 0), 0);
      totalCompleted += sp.filter(p => p.completed).length;
    }
    for (const bid of tBookIds) {
      totalLessons += (bookLessonMap[bid] ?? 0) * tStudentIds.length;
    }

    const avgScore = tStudentIds.length > 0 ? Math.round(totalScore / tStudentIds.length) : 0;
    const avgCompletion = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

    const classBreakdown = tClassIds.map(cid => {
      const classStudents = classStudentMap[cid] ?? [];
      const classBooks = [...new Set(classBookMap[cid] ?? [])];
      let cs = 0, cc = 0, cl = 0;
      for (const sid of classStudents) {
        // deduplicate progress by lessonId before summing
        const sp = progressRows.filter(p => p.studentId === sid && p.bookId !== null && classBooks.includes(p.bookId));
        const byLesson = new Map<number | null, typeof sp[0]>();
        for (const p of sp) { if (!byLesson.has(p.lessonId ?? null) || p.completed) byLesson.set(p.lessonId ?? null, p); }
        const deduped = [...byLesson.values()];
        cs += deduped.reduce((s, p) => s + (p.score ?? 0), 0);
        cc += deduped.filter(p => p.completed).length;
      }
      for (const bid of classBooks) cl += (bookLessonMap[bid] ?? 0) * classStudents.length;
      return {
        classId: cid,
        className: classNameMap[cid] ?? "",
        studentCount: classStudents.length,
        avgScore: classStudents.length > 0 ? Math.round(cs / classStudents.length) : 0,
        avgCompletion: cl > 0 ? Math.min(100, Math.round((cc / cl) * 100)) : 0,
        books: classBooks.map(bid => ({ bookId: bid, bookTitle: bookTitleMap[bid] ?? `کتاب ${bid}`, lessonCount: bookLessonMap[bid] ?? 0 })),
      };
    });

    return {
      ...t,
      lastLoginAt: t.lastLoginAt ? new Date(t.lastLoginAt).toISOString() : null,
      classIds: tClassIds,
      classNames: tClassIds.map(cid => classNameMap[cid]).filter(Boolean),
      studentCount: tStudentIds.length,
      avgScore,
      avgCompletion,
      classBreakdown,
    };
  });

  res.json(result);
});

router.get("/school-report/students", async (req, res) => {
  const { schoolId, branchId } = req.query as Record<string, string>;
  let classIds: number[];
  if (branchId) {
    classIds = await getBranchClassIds(parseInt(branchId));
  } else if (schoolId) {
    classIds = await getSchoolClassIds(parseInt(schoolId));
  } else {
    res.status(400).json({ error: "schoolId or branchId required" }); return;
  }
  if (!classIds.length) { res.json([]); return; }

  const studentRows = await db
    .select({ studentId: classStudentsTable.studentId, classId: classStudentsTable.classId })
    .from(classStudentsTable)
    .where(inArray(classStudentsTable.classId, classIds));

  const uniqueStudentIds = [...new Set(studentRows.map(r => r.studentId))];
  if (!uniqueStudentIds.length) { res.json([]); return; }

  const allBookIds = (await db.select({ bookId: classBooksTable.bookId }).from(classBooksTable).where(inArray(classBooksTable.classId, classIds))).map(r => r.bookId);
  const uniqueBookIds = [...new Set(allBookIds)];

  const [students, books, allPresence, allProgress] = await Promise.all([
    db.select().from(usersTable).where(inArray(usersTable.id, uniqueStudentIds)),
    uniqueBookIds.length > 0 ? db.select().from(booksTable).where(inArray(booksTable.id, uniqueBookIds)) : Promise.resolve([]),
    db.select().from(presenceLogTable).where(inArray(presenceLogTable.studentId, uniqueStudentIds)),
    db.select().from(studentProgressTable).where(inArray(studentProgressTable.studentId, uniqueStudentIds)),
  ]);

  const studentClassMap: Record<number, number> = {};
  for (const r of studentRows) studentClassMap[r.studentId] = r.classId;

  const allClasses = await db.select({ id: classesTable.id, name: classesTable.name }).from(classesTable).where(inArray(classesTable.id, classIds));
  const classNameMap: Record<number, string> = {};
  for (const c of allClasses) classNameMap[c.id] = c.name;

  const result = students.map(({ password: _pw, ...s }) => {
    const sp = allPresence.filter(p => p.studentId === s.id);
    const sorted = [...sp].sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());
    const totalMinutes = sp.reduce((sum, p) => sum + (p.durationMinutes ?? 0), 0);
    const prog = allProgress.filter(p => p.studentId === s.id);
    const totalScore = prog.reduce((sum, p) => sum + (p.score ?? 0), 0);
    const bookProgress = books.map(book => {
      const bp = prog.filter(p => p.bookId === book.id);
      const completed = bp.filter(p => p.completed).length;
      return { bookId: book.id, bookTitle: book.title, lessonCount: book.lessonCount, completedLessons: completed };
    }).filter(bp => bp.lessonCount > 0);
    return {
      ...s,
      lastLoginAt: s.lastLoginAt ? new Date(s.lastLoginAt).toISOString() : null,
      lastPresenceAt: sorted[0]?.enteredAt ? new Date(sorted[0].enteredAt).toISOString() : null,
      totalMinutesInApp: totalMinutes,
      totalScore,
      bookProgress,
      className: classNameMap[studentClassMap[s.id]] ?? null,
      classId: studentClassMap[s.id] ?? null,
    };
  });

  res.json(result);
});

router.get("/school-report/class-detail", async (req, res) => {
  const { classId } = req.query as Record<string, string>;
  if (!classId) { res.status(400).json({ error: "classId required" }); return; }
  const cid = parseInt(classId);

  const [studentRows, bookRows] = await Promise.all([
    db.select({ studentId: classStudentsTable.studentId }).from(classStudentsTable).where(eq(classStudentsTable.classId, cid)),
    db.select({ bookId: classBooksTable.bookId }).from(classBooksTable).where(eq(classBooksTable.classId, cid)),
  ]);
  const studentIds = studentRows.map(r => r.studentId);
  const bookIds = bookRows.map(r => r.bookId);
  if (!bookIds.length) { res.json([]); return; }

  const [books, lessons] = await Promise.all([
    db.select({ id: booksTable.id, title: booksTable.title }).from(booksTable).where(inArray(booksTable.id, bookIds)),
    db.select().from(lessonsTable).where(inArray(lessonsTable.bookId, bookIds)),
  ]);

  const lessonIds = lessons.map(l => l.id);
  let progress: { studentId: number; lessonId: number; completed: boolean; score: number }[] = [];
  if (studentIds.length > 0 && lessonIds.length > 0) {
    const rows = await db
      .select({ studentId: studentProgressTable.studentId, lessonId: studentProgressTable.lessonId, completed: studentProgressTable.completed, score: studentProgressTable.score })
      .from(studentProgressTable)
      .where(inArray(studentProgressTable.studentId, studentIds));
    progress = rows.map(r => ({ studentId: r.studentId, lessonId: r.lessonId, completed: r.completed ?? false, score: r.score ?? 0 }));
  }

  const result = books.map(book => {
    const bookLessons = lessons
      .filter(l => l.bookId === book.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return {
      bookId: book.id,
      bookTitle: book.title,
      totalStudents: studentIds.length,
      lessons: bookLessons.map(lesson => {
        // deduplicate by studentId — keep completed=true row if exists
        const lpAll = progress.filter(p => p.lessonId === lesson.id);
        const byStudent = new Map<number, typeof lpAll[0]>();
        for (const p of lpAll) {
          const existing = byStudent.get(p.studentId);
          if (!existing || p.completed) byStudent.set(p.studentId, p);
        }
        const lp = [...byStudent.values()];
        const completedCount = lp.filter(p => p.completed).length;
        const avgScore = lp.length > 0 ? Math.round(lp.reduce((s, p) => s + p.score, 0) / lp.length) : 0;
        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          orderIndex: lesson.orderIndex,
          completedCount,
          completionPct: studentIds.length > 0 ? Math.min(100, Math.round((completedCount / studentIds.length) * 100)) : 0,
          avgScore,
        };
      }),
    };
  });

  res.json(result);
});

export default router;
