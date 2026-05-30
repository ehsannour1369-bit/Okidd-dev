import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  db, branchesTable, gradeLevelsTable, gradesTable, classesTable,
  classStudentsTable, usersTable, branchManagersTable,
} from "@workspace/db";
import { eq, inArray, count, and, or } from "drizzle-orm";

const router = Router();

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

// ─── List ─────────────────────────────────────────────────────────────────────
router.get("/branches", async (req, res) => {
  const { schoolId } = req.query as Record<string, string>;
  let branches = await db.select().from(branchesTable);
  if (schoolId) branches = branches.filter(b => b.schoolId === parseInt(schoolId));

  const enriched = await Promise.all(branches.map(async branch => {
    const studentCount = await getBranchStudentCount(branch.id);
    const [bm] = await db.select().from(branchManagersTable).where(
      and(eq(branchManagersTable.branchId, branch.id), eq(branchManagersTable.isActive, true))
    );
    let manager = null;
    if (bm) {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, bm.userId));
      if (u) { const { password: _pw, ...safe } = u; manager = safe; }
    }
    return { ...branch, studentCount, manager };
  }));
  res.json(enriched);
});

// ─── Create ───────────────────────────────────────────────────────────────────
router.post("/branches", async (req, res) => {
  const {
    selectedManagerUserId,
    managerName, managerPhone, managerNationalId,
    educationalLevels,
    academicYear = "1403-1404",
    // legacy fields (kept for backward compat)
    createManagerAccount, managerEmail, managerPassword,
    ...branchData
  } = req.body;

  // Duplicate user check for branch manager
  if (!selectedManagerUserId && !managerEmail && (managerPhone || managerNationalId)) {
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

  const [branch] = await db.insert(branchesTable).values({
    ...branchData,
    academicYear,
    managerName: managerName ?? null,
    managerPhone: managerPhone ?? null,
    managerNationalId: managerNationalId ?? null,
    educationalLevels: Array.isArray(educationalLevels)
      ? educationalLevels.join(",")
      : (educationalLevels ?? null),
  }).returning();

  // Assign existing user as branch manager
  if (selectedManagerUserId) {
    const uid = Number(selectedManagerUserId);
    // Deactivate any previous active manager for this branch+year
    await db.update(branchManagersTable)
      .set({ isActive: false })
      .where(and(eq(branchManagersTable.branchId, branch.id), eq(branchManagersTable.isActive, true)));
    await db.update(usersTable)
      .set({ role: "branch_manager", schoolId: branch.schoolId } as any)
      .where(eq(usersTable.id, uid));
    await db.update(branchesTable).set({ managerUserId: uid }).where(eq(branchesTable.id, branch.id));
    await db.insert(branchManagersTable).values({ userId: uid, branchId: branch.id, academicYear, isActive: true });
    const studentCount = await getBranchStudentCount(branch.id);
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
    const { password: _pw, ...safeManager } = u ?? {};
    res.status(201).json({ ...branch, managerUserId: uid, studentCount, manager: safeManager });
    return;
  }

  // Auto-create new branch manager user (from phone/name fields)
  if (managerPhone || managerName) {
    const email = managerPhone ? `${managerPhone}@okidd.com` : `bm.${branch.id}@okidd.com`;
    const rawPw = managerNationalId ?? managerPhone ?? "okidd1234";
    const hashed = await bcrypt.hash(rawPw, 10);
    const [manager] = await db.insert(usersTable).values({
      name: managerName ?? `مدیر شعبه ${branch.name}`,
      email,
      password: hashed,
      phone: managerPhone ?? null,
      nationalId: managerNationalId ?? null,
      role: "branch_manager",
      schoolId: branch.schoolId,
      status: "active",
    } as any).returning();
    await db.update(branchesTable).set({ managerUserId: manager.id }).where(eq(branchesTable.id, branch.id));
    await db.insert(branchManagersTable).values({ userId: manager.id, branchId: branch.id, academicYear, isActive: true });
    const { password: _pw, ...safeManager } = manager;
    res.status(201).json({ ...branch, managerUserId: manager.id, studentCount: 0, manager: safeManager });
    return;
  }

  // Legacy: email+password flow
  if (createManagerAccount && managerEmail && managerPassword) {
    const hashed = await bcrypt.hash(managerPassword, 10);
    const [manager] = await db.insert(usersTable).values({
      name: managerName ?? `مدیر شعبه ${branch.name}`,
      email: managerEmail,
      password: hashed,
      phone: managerPhone ?? null,
      role: "branch_manager",
      schoolId: branch.schoolId,
      status: "active",
    }).returning();
    await db.update(branchesTable).set({ managerUserId: manager.id }).where(eq(branchesTable.id, branch.id));
    await db.insert(branchManagersTable).values({ userId: manager.id, branchId: branch.id, academicYear, isActive: true });
    const { password: _pw, ...safeManager } = manager;
    res.status(201).json({ ...branch, managerUserId: manager.id, studentCount: 0, manager: safeManager });
    return;
  }

  res.status(201).json({ ...branch, studentCount: 0, manager: null });
});

// ─── Update ───────────────────────────────────────────────────────────────────
router.put("/branches/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    selectedManagerUserId, managerName, managerPhone, managerNationalId,
    educationalLevels, academicYear, createManagerAccount, managerEmail, managerPassword, ...rest
  } = req.body;
  const [branch] = await db.update(branchesTable).set({
    ...rest,
    managerName: managerName ?? null,
    managerPhone: managerPhone ?? null,
    managerNationalId: managerNationalId ?? null,
    educationalLevels: Array.isArray(educationalLevels) ? educationalLevels.join(",") : (educationalLevels ?? null),
    academicYear: academicYear ?? null,
  }).where(eq(branchesTable.id, id)).returning();
  if (!branch) { res.status(404).json({ error: "Not found" }); return; }
  const studentCount = await getBranchStudentCount(id);
  res.json({ ...branch, studentCount });
});

// ─── Delete ───────────────────────────────────────────────────────────────────
router.delete("/branches/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(branchesTable).where(eq(branchesTable.id, id));
  res.status(204).end();
});

export default router;
