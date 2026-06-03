import { Router } from "express";
import { db, usersTable, branchesTable, gradeLevelsTable, gradesTable, classesTable, classTeachersTable, classStudentsTable, classBooksTable, booksTable } from "@workspace/db";
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

  const teachers = await db.select().from(usersTable).where(inArray(usersTable.id, uniqueTeacherIds));

  const classMap: Record<number, number[]> = {};
  for (const r of teacherRows) {
    if (!classMap[r.teacherId]) classMap[r.teacherId] = [];
    if (!classMap[r.teacherId].includes(r.classId)) classMap[r.teacherId].push(r.classId);
  }

  const allClasses = await db.select({ id: classesTable.id, name: classesTable.name }).from(classesTable).where(inArray(classesTable.id, classIds));
  const classNameMap: Record<number, string> = {};
  for (const c of allClasses) classNameMap[c.id] = c.name;

  const result = teachers.map(({ password: _pw, ...t }) => ({
    ...t,
    lastLoginAt: t.lastLoginAt ? new Date(t.lastLoginAt).toISOString() : null,
    classIds: classMap[t.id] ?? [],
    classNames: (classMap[t.id] ?? []).map(cid => classNameMap[cid]).filter(Boolean),
  }));

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

export default router;
