import { Router } from "express";
import { db, usersTable, schoolsTable, transactionsTable, booksTable, branchesTable, classesTable, classStudentsTable, classTeachersTable, gradeLevelsTable, gradesTable } from "@workspace/db";
import { eq, count, sum, inArray } from "drizzle-orm";

const router = Router();

router.get("/dashboard/admin-stats", async (req, res) => {
  const allUsers = await db.select().from(usersTable);
  const allSchools = await db.select().from(schoolsTable);
  const txRows = await db.select().from(transactionsTable);

  const totalSchools = allSchools.length;
  const activeSchools = allSchools.filter(s => s.status === "active").length;
  const totalTeachers = allUsers.filter(u => u.role === "teacher").length;
  const totalStudents = allUsers.filter(u => u.role === "student").length;
  const totalParents = allUsers.filter(u => u.role === "parent").length;
  const totalRevenue = txRows.reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const recentTransactions = txRows
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(t => ({
      ...t,
      amount: parseFloat(String(t.amount)),
      discount: parseFloat(String(t.discount)),
      balance: t.balance !== null ? parseFloat(String(t.balance)) : null,
      paymentDate: t.paymentDate instanceof Date ? t.paymentDate.toISOString() : String(t.paymentDate),
      schoolName: null,
      packageName: null,
    }));

  res.json({ totalSchools, totalTeachers, totalStudents, totalParents, totalRevenue, activeSchools, recentTransactions });
});

router.get("/dashboard/school-stats", async (req, res) => {
  const { schoolId } = req.query as Record<string, string>;
  if (!schoolId) { res.status(400).json({ error: "schoolId required" }); return; }
  const sid = parseInt(schoolId);

  const branches = await db.select().from(branchesTable).where(eq(branchesTable.schoolId, sid));
  const branchIds = branches.map(b => b.id);
  let totalClasses = 0, totalTeachers = 0, totalStudents = 0, totalBooks = 0;

  if (branchIds.length > 0) {
    const glRows = await db.select().from(gradeLevelsTable).where(inArray(gradeLevelsTable.branchId, branchIds));
    const glIds = glRows.map(g => g.id);
    if (glIds.length > 0) {
      const gradeRows = await db.select().from(gradesTable).where(inArray(gradesTable.gradeLevelId, glIds));
      const gradeIds = gradeRows.map(g => g.id);
      if (gradeIds.length > 0) {
        const classRows = await db.select().from(classesTable).where(inArray(classesTable.gradeId, gradeIds));
        const classIds = classRows.map(c => c.id);
        totalClasses = classRows.length;
        if (classIds.length > 0) {
          const [stu, tea] = await Promise.all([
            db.select({ count: count() }).from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds)),
            db.select({ count: count() }).from(classTeachersTable).where(inArray(classTeachersTable.classId, classIds)),
          ]);
          totalStudents = Number(stu[0]?.count ?? 0);
          totalTeachers = Number(tea[0]?.count ?? 0);
        }
      }
    }
  }

  const allBooks = await db.select({ cnt: count() }).from(booksTable);
  totalBooks = Number(allBooks[0]?.cnt ?? 0);

  res.json({ totalBranches: branches.length, totalClasses, totalTeachers, totalStudents, totalBooks });
});

export default router;
