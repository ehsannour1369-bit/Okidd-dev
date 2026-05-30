import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, branchManagersTable, branchesTable, usersTable, schoolsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// List branch managers (optionally filtered by branchId or schoolId)
router.get("/branch-managers", async (req, res) => {
  const { branchId, schoolId } = req.query as Record<string, string>;
  let rows = await db.select().from(branchManagersTable);
  if (branchId) rows = rows.filter(r => r.branchId === parseInt(branchId));

  // Enrich with user and branch info
  const enriched = await Promise.all(rows.map(async bm => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, bm.userId));
    const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, bm.branchId));
    const { password: _pw, ...safeUser } = user ?? { password: "" };
    return { ...bm, user: user ? safeUser : null, branch: branch ?? null };
  }));

  if (schoolId) {
    const schoolIdNum = parseInt(schoolId);
    res.json(enriched.filter(r => r.branch?.schoolId === schoolIdNum));
    return;
  }
  res.json(enriched);
});

// Get active branch_manager for a specific user
router.get("/branch-managers/my-branch", async (req, res) => {
  const { userId } = req.query as Record<string, string>;
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }

  const [bm] = await db.select().from(branchManagersTable).where(
    and(eq(branchManagersTable.userId, parseInt(userId)), eq(branchManagersTable.isActive, true))
  );
  if (!bm) { res.status(404).json({ error: "No active branch assignment" }); return; }

  const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, bm.branchId));
  const [school] = branch ? await db.select().from(schoolsTable).where(eq(schoolsTable.id, branch.schoolId)) : [null];
  res.json({ ...bm, branch: branch ?? null, school: school ?? null });
});

// Assign a branch manager (deactivates previous active manager for same branch+year)
router.post("/branch-managers", async (req, res) => {
  const { userId, branchId, academicYear = "1403-1404", createAccount, managerName, managerEmail, managerPassword, managerPhone } = req.body;

  let finalUserId = userId;

  // Optionally create a new branch_manager account
  if (createAccount && managerEmail && managerPassword) {
    const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, branchId));
    const hashed = await bcrypt.hash(managerPassword, 10);
    const [newUser] = await db.insert(usersTable).values({
      name: managerName ?? `مدیر شعبه`,
      email: managerEmail,
      password: hashed,
      phone: managerPhone ?? null,
      role: "branch_manager",
      schoolId: branch?.schoolId ?? null,
      status: "active",
    }).returning();
    finalUserId = newUser.id;
  }

  if (!finalUserId || !branchId) { res.status(400).json({ error: "userId and branchId required" }); return; }

  // Deactivate previous active manager for this branch+year
  await db.update(branchManagersTable)
    .set({ isActive: false })
    .where(and(
      eq(branchManagersTable.branchId, branchId),
      eq(branchManagersTable.academicYear, academicYear),
      eq(branchManagersTable.isActive, true)
    ));

  // Update user role to branch_manager
  await db.update(usersTable).set({ role: "branch_manager" } as any).where(eq(usersTable.id, finalUserId));

  // Update branch.managerUserId
  await db.update(branchesTable).set({ managerUserId: finalUserId }).where(eq(branchesTable.id, branchId));

  const [bm] = await db.insert(branchManagersTable).values({
    userId: finalUserId,
    branchId,
    academicYear,
    isActive: true,
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, finalUserId));
  const { password: _pw, ...safeUser } = user ?? { password: "" };
  res.status(201).json({ ...bm, user: user ? safeUser : null });
});

// Deactivate a branch manager assignment (e.g. when replacing)
router.patch("/branch-managers/:id/deactivate", async (req, res) => {
  const id = parseInt(req.params.id);
  const [bm] = await db.update(branchManagersTable).set({ isActive: false }).where(eq(branchManagersTable.id, id)).returning();
  if (!bm) { res.status(404).json({ error: "Not found" }); return; }
  res.json(bm);
});

export default router;
