import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  db, schoolsTable, branchesTable, classStudentsTable, classTeachersTable,
  gradesTable, gradeLevelsTable, classesTable, usersTable,
  transactionsTable, packagesTable,
} from "@workspace/db";
import { eq, count, inArray, or, sum } from "drizzle-orm";

const router = Router();

async function getSchoolCounts(schoolId: number) {
  const branches = await db.select().from(branchesTable).where(eq(branchesTable.schoolId, schoolId));
  const branchIds = branches.map(b => b.id);
  let studentCount = 0, teacherCount = 0;
  if (branchIds.length > 0) {
    const glRows = await db.select().from(gradeLevelsTable).where(inArray(gradeLevelsTable.branchId, branchIds));
    const glIds = glRows.map(g => g.id);
    if (glIds.length > 0) {
      const gradeRows = await db.select().from(gradesTable).where(inArray(gradesTable.gradeLevelId, glIds));
      const gradeIds = gradeRows.map(g => g.id);
      if (gradeIds.length > 0) {
        const classRows = await db.select().from(classesTable).where(inArray(classesTable.gradeId, gradeIds));
        const classIds = classRows.map(c => c.id);
        if (classIds.length > 0) {
          const stu = await db.select({ count: count() }).from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds));
          const tea = await db.select({ count: count() }).from(classTeachersTable).where(inArray(classTeachersTable.classId, classIds));
          studentCount = Number(stu[0]?.count ?? 0);
          teacherCount = Number(tea[0]?.count ?? 0);
        }
      }
    }
  }
  return { branchCount: branches.length, studentCount, teacherCount };
}

async function getSchoolTotalPackages(schoolId: number): Promise<number> {
  const rows = await db
    .select({ total: sum(packagesTable.studentCount) })
    .from(transactionsTable)
    .innerJoin(packagesTable, eq(transactionsTable.packageId, packagesTable.id))
    .where(eq(transactionsTable.schoolId, schoolId));
  return Number(rows[0]?.total ?? 0);
}

async function getBranchStudentCount(branchId: number): Promise<number> {
  const glRows = await db.select().from(gradeLevelsTable).where(eq(gradeLevelsTable.branchId, branchId));
  const glIds = glRows.map(g => g.id);
  if (glIds.length === 0) return 0;
  const gradeRows = await db.select().from(gradesTable).where(inArray(gradesTable.gradeLevelId, glIds));
  const gradeIds = gradeRows.map(g => g.id);
  if (gradeIds.length === 0) return 0;
  const classRows = await db.select().from(classesTable).where(inArray(classesTable.gradeId, gradeIds));
  const classIds = classRows.map(c => c.id);
  if (classIds.length === 0) return 0;
  const stu = await db.select({ count: count() }).from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds));
  return Number(stu[0]?.count ?? 0);
}

async function getSchoolBranchDetails(schoolId: number) {
  const branches = await db.select().from(branchesTable).where(eq(branchesTable.schoolId, schoolId));
  return Promise.all(branches.map(async b => {
    const studentCount = await getBranchStudentCount(b.id);
    let managerName = b.managerName ?? null;
    if (!managerName && b.managerUserId) {
      const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, b.managerUserId));
      if (u) managerName = u.name;
    }
    return { branchId: b.id, branchName: b.name, studentCount, managerName, academicYear: b.academicYear };
  }));
}

// ─── List ─────────────────────────────────────────────────────────────────────
router.get("/schools", async (req, res) => {
  const schools = await db.select().from(schoolsTable);
  const enriched = await Promise.all(schools.map(async s => {
    const counts = await getSchoolCounts(s.id);
    const totalPackages = await getSchoolTotalPackages(s.id);
    const branchDetails = await getSchoolBranchDetails(s.id);
    return { ...s, ...counts, totalPackages, branchDetails };
  }));
  res.json(enriched);
});

// ─── Get one ──────────────────────────────────────────────────────────────────
router.get("/schools/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, id));
  if (!school) { res.status(404).json({ error: "Not found" }); return; }
  const counts = await getSchoolCounts(id);
  const totalPackages = await getSchoolTotalPackages(id);
  const branchDetails = await getSchoolBranchDetails(id);
  let manager = null;
  if (school.managerUserId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, school.managerUserId));
    if (u) { const { password: _pw, ...safe } = u; manager = safe; }
  }
  res.json({ ...school, ...counts, totalPackages, branchDetails, manager });
});

// ─── Create ───────────────────────────────────────────────────────────────────
router.post("/schools", async (req, res) => {
  const { managerName, managerPhone, managerNationalId, selectedManagerUserId, ...schoolData } = req.body;

  // Duplicate user check (skip if admin explicitly selected an existing user)
  if (!selectedManagerUserId && (managerPhone || managerNationalId)) {
    const conditions: ReturnType<typeof eq>[] = [];
    if (managerPhone) conditions.push(eq(usersTable.phone, managerPhone));
    if (managerNationalId) conditions.push(eq(usersTable.nationalId, managerNationalId));
    const duplicates = await db.select().from(usersTable).where(or(...conditions));
    if (duplicates.length > 0) {
      const candidates = duplicates.map(({ password: _pw, ...safe }) => safe);
      res.json({ status: "duplicate_found", candidates });
      return;
    }
  }

  const [school] = await db.insert(schoolsTable).values({
    ...schoolData,
    managerName: managerName ?? null,
    managerPhone: managerPhone ?? null,
    managerNationalId: managerNationalId ?? null,
  }).returning();

  if (selectedManagerUserId) {
    await db.update(usersTable)
      .set({ role: "school_manager", schoolId: school.id } as any)
      .where(eq(usersTable.id, Number(selectedManagerUserId)));
    await db.update(schoolsTable)
      .set({ managerUserId: Number(selectedManagerUserId) })
      .where(eq(schoolsTable.id, school.id));
  } else if (managerPhone || managerName) {
    const email = managerPhone ? `${managerPhone}@okidd.com` : `manager.${school.id}@okidd.com`;
    const rawPw = managerNationalId ?? managerPhone ?? "okidd1234";
    const hashed = await bcrypt.hash(rawPw, 10);
    const [manager] = await db.insert(usersTable).values({
      name: managerName ?? `مدیر ${school.name}`,
      email,
      password: hashed,
      phone: managerPhone ?? null,
      nationalId: managerNationalId ?? null,
      role: "school_manager",
      schoolId: school.id,
      status: "active",
    } as any).returning();
    await db.update(schoolsTable).set({ managerUserId: manager.id }).where(eq(schoolsTable.id, school.id));
  }

  const counts = await getSchoolCounts(school.id);
  const totalPackages = await getSchoolTotalPackages(school.id);
  const branchDetails = await getSchoolBranchDetails(school.id);
  res.status(201).json({ ...school, ...counts, totalPackages, branchDetails });
});

// ─── Update ───────────────────────────────────────────────────────────────────
router.put("/schools/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { managerName, managerPhone, managerNationalId, selectedManagerUserId, ...rest } = req.body;
  const [school] = await db.update(schoolsTable)
    .set({ ...rest, managerName: managerName ?? null, managerPhone: managerPhone ?? null, managerNationalId: managerNationalId ?? null })
    .where(eq(schoolsTable.id, id))
    .returning();
  if (!school) { res.status(404).json({ error: "Not found" }); return; }
  const counts = await getSchoolCounts(id);
  const totalPackages = await getSchoolTotalPackages(id);
  const branchDetails = await getSchoolBranchDetails(id);
  res.json({ ...school, ...counts, totalPackages, branchDetails });
});

// ─── Toggle status ────────────────────────────────────────────────────────────
router.patch("/schools/:id/toggle-status", async (req, res) => {
  const id = parseInt(req.params.id);
  const [current] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, id));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }
  const newStatus = current.status === "active" ? "inactive" : "active";
  const [school] = await db.update(schoolsTable).set({ status: newStatus }).where(eq(schoolsTable.id, id)).returning();
  const counts = await getSchoolCounts(id);
  const totalPackages = await getSchoolTotalPackages(id);
  const branchDetails = await getSchoolBranchDetails(id);
  res.json({ ...school, ...counts, totalPackages, branchDetails });
});

// ─── Delete ───────────────────────────────────────────────────────────────────
router.delete("/schools/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, id));
  if (!school) { res.status(404).json({ error: "Not found" }); return; }
  // Reset manager user's role/schoolId before deleting
  if (school.managerUserId) {
    await db.update(usersTable)
      .set({ role: "student", schoolId: null } as any)
      .where(eq(usersTable.id, school.managerUserId));
  }
  await db.delete(schoolsTable).where(eq(schoolsTable.id, id));
  res.status(204).end();
});

// ─── Update logo ──────────────────────────────────────────────────────────────
router.patch("/schools/:id/logo", async (req, res) => {
  const id = parseInt(req.params.id);
  const { logoUrl } = req.body;
  const [school] = await db.update(schoolsTable)
    .set({ logoUrl: logoUrl ?? null })
    .where(eq(schoolsTable.id, id))
    .returning();
  if (!school) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ logoUrl: school.logoUrl });
});

// ─── Assign existing user as manager ─────────────────────────────────────────
router.patch("/schools/:id/assign-manager", async (req, res) => {
  const id = parseInt(req.params.id);
  const { userId } = req.body;
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  await db.update(usersTable).set({ role: "school_manager", schoolId: id } as any).where(eq(usersTable.id, userId));
  const [school] = await db.update(schoolsTable).set({ managerUserId: userId }).where(eq(schoolsTable.id, id)).returning();
  if (!school) { res.status(404).json({ error: "Not found" }); return; }
  const counts = await getSchoolCounts(id);
  const totalPackages = await getSchoolTotalPackages(id);
  const branchDetails = await getSchoolBranchDetails(id);
  res.json({ ...school, ...counts, totalPackages, branchDetails });
});

export default router;
