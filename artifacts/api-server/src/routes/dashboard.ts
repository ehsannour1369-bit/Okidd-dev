import { Router } from "express";
import {
  db, usersTable, schoolsTable, booksTable, branchesTable, classesTable,
  classStudentsTable, classTeachersTable, gradeLevelsTable, gradesTable,
  bookOrdersTable, schoolTeachersTable, studentEnrollmentsTable,
} from "@workspace/db";
import { eq, count, and, inArray } from "drizzle-orm";

const router = Router();

router.get("/dashboard/admin-stats", async (req, res) => {
  const allUsers = await db.select().from(usersTable);
  const allSchools = await db.select().from(schoolsTable);
  const paidOrders = await db.select().from(bookOrdersTable);

  const totalSchools = allSchools.length;
  const activeSchools = allSchools.filter(s => s.status === "active").length;
  const totalTeachers = allUsers.filter(u => u.role === "teacher").length;
  const totalStudents = allUsers.filter(u => u.role === "student").length;
  const totalParents = allUsers.filter(u => u.role === "parent").length;
  const totalRevenue = paidOrders
    .filter(o => o.status === "paid")
    .reduce((s, o) => s + parseFloat(String(o.finalAmount)), 0);

  const recentTransactions: unknown[] = [];

  res.json({ totalSchools, totalTeachers, totalStudents, totalParents, totalRevenue, activeSchools, recentTransactions });
});

router.get("/dashboard/school-stats", async (req, res) => {
  const { schoolId, branchId } = req.query as Record<string, string>;
  if (!schoolId) { res.status(400).json({ error: "schoolId required" }); return; }
  const sid = parseInt(schoolId);
  const bid = branchId ? parseInt(branchId) : null;

  // ─── branches ────────────────────────────────────────────────────────────────
  const branches = await db.select().from(branchesTable).where(eq(branchesTable.schoolId, sid));
  const targetBranchIds = bid ? [bid] : branches.map(b => b.id);

  // ─── totalClasses (via grade hierarchy of target branches) ───────────────────
  let totalClasses = 0;
  let classIds: number[] = [];
  if (targetBranchIds.length > 0) {
    const glRows = await db.select().from(gradeLevelsTable).where(inArray(gradeLevelsTable.branchId, targetBranchIds));
    const glIds = glRows.map(g => g.id);
    if (glIds.length > 0) {
      const gradeRows = await db.select().from(gradesTable).where(inArray(gradesTable.gradeLevelId, glIds));
      const gradeIds = gradeRows.map(g => g.id);
      if (gradeIds.length > 0) {
        const classRows = await db.select().from(classesTable).where(inArray(classesTable.gradeId, gradeIds));
        totalClasses = classRows.length;
        classIds = classRows.map(c => c.id);
      }
    }
  }

  // ─── totalTeachers ───────────────────────────────────────────────────────────
  // Branch scope: unique teachers in classes of that branch
  // School scope: teachers registered with the school
  let totalTeachers = 0;
  if (bid) {
    if (classIds.length > 0) {
      const rows = await db.select({ count: count() }).from(classTeachersTable)
        .where(inArray(classTeachersTable.classId, classIds));
      totalTeachers = Number(rows[0]?.count ?? 0);
    }
  } else {
    const rows = await db.select({ count: count() }).from(schoolTeachersTable)
      .where(eq(schoolTeachersTable.schoolId, sid));
    totalTeachers = Number(rows[0]?.count ?? 0);
  }

  // ─── totalStudents ───────────────────────────────────────────────────────────
  // Branch scope: active enrollments in that branch
  // School scope: active enrollments in the school
  let totalStudents = 0;
  if (bid) {
    const rows = await db.select({ count: count() }).from(studentEnrollmentsTable)
      .where(and(eq(studentEnrollmentsTable.schoolId, sid), eq(studentEnrollmentsTable.branchId, bid), eq(studentEnrollmentsTable.isActive, true)));
    totalStudents = Number(rows[0]?.count ?? 0);
  } else {
    const rows = await db.select({ count: count() }).from(studentEnrollmentsTable)
      .where(and(eq(studentEnrollmentsTable.schoolId, sid), eq(studentEnrollmentsTable.isActive, true)));
    totalStudents = Number(rows[0]?.count ?? 0);
  }

  // ─── totalBooks ──────────────────────────────────────────────────────────────
  const allBooks = await db.select({ cnt: count() }).from(booksTable);
  const totalBooks = Number(allBooks[0]?.cnt ?? 0);

  res.json({ totalBranches: branches.length, totalClasses, totalTeachers, totalStudents, totalBooks });
});

export default router;
