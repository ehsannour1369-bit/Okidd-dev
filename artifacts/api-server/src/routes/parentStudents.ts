import { Router } from "express";
import { db } from "@workspace/db";
import { parentStudentsTable, usersTable } from "@workspace/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";

const router = Router();

// GET /parent-students — query by parentId or studentId
router.get("/parent-students", async (req, res) => {
  const { parentId, studentId, activeOnly } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (activeOnly !== "false") conditions.push(eq(parentStudentsTable.isActive, true));
  if (parentId) conditions.push(eq(parentStudentsTable.parentId, parseInt(parentId)));
  if (studentId) conditions.push(eq(parentStudentsTable.studentId, parseInt(studentId)));

  const rows = await db.select().from(parentStudentsTable).where(conditions.length ? and(...conditions) : undefined);
  const enriched = await Promise.all(rows.map(async (r) => {
    const [parent] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone, nationalId: usersTable.nationalId, gender: usersTable.gender }).from(usersTable).where(eq(usersTable.id, r.parentId));
    const [student] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone, nationalId: usersTable.nationalId, gender: usersTable.gender, schoolId: usersTable.schoolId }).from(usersTable).where(eq(usersTable.id, r.studentId));
    return { ...r, parent: parent ?? null, student: student ?? null };
  }));
  res.json(enriched);
});

// GET /students/search-by-national-id — for parent self-service
router.get("/students/search-by-national-id", async (req, res) => {
  const { nationalId } = req.query as Record<string, string>;
  if (!nationalId || nationalId.length < 3) { res.json([]); return; }
  const students = await db.select({
    id: usersTable.id, name: usersTable.name, email: usersTable.email,
    phone: usersTable.phone, nationalId: usersTable.nationalId,
    gender: usersTable.gender, schoolId: usersTable.schoolId,
  }).from(usersTable).where(and(eq(usersTable.role, "student"), eq(usersTable.nationalId, nationalId)));
  res.json(students);
});

// GET /parents/search — search parents by name/email/phone/nationalId
router.get("/parents/search", async (req, res) => {
  const { q } = req.query as Record<string, string>;
  if (!q || q.length < 2) { res.json([]); return; }
  const parents = await db.select({
    id: usersTable.id, name: usersTable.name, email: usersTable.email,
    phone: usersTable.phone, nationalId: usersTable.nationalId, gender: usersTable.gender,
  }).from(usersTable).where(
    and(
      eq(usersTable.role, "parent"),
      or(
        ilike(usersTable.name, `%${q}%`),
        ilike(usersTable.email, `%${q}%`),
        ilike(usersTable.phone ?? "", `%${q}%`),
        ilike(usersTable.nationalId ?? "", `%${q}%`),
      )
    )
  ).limit(20);
  res.json(parents);
});

// POST /parent-students — create link
router.post("/parent-students", async (req, res) => {
  const { parentId, studentId, relationType, notes } = req.body as {
    parentId: number; studentId: number; relationType?: string; notes?: string;
  };
  if (!parentId || !studentId) { res.status(400).json({ error: "parentId و studentId الزامی است" }); return; }

  const [parent] = await db.select().from(usersTable).where(and(eq(usersTable.id, parentId), eq(usersTable.role, "parent")));
  if (!parent) { res.status(400).json({ error: "کاربر مورد نظر نقش والد ندارد" }); return; }

  const [student] = await db.select().from(usersTable).where(and(eq(usersTable.id, studentId), eq(usersTable.role, "student")));
  if (!student) { res.status(400).json({ error: "دانش‌آموز یافت نشد" }); return; }

  const existingParents = await db.select().from(parentStudentsTable).where(
    and(eq(parentStudentsTable.studentId, studentId), eq(parentStudentsTable.isActive, true))
  );
  if (existingParents.length >= 2) { res.status(400).json({ error: "هر دانش‌آموز حداکثر ۲ والد می‌تواند داشته باشد" }); return; }

  const duplicate = existingParents.find(p => p.parentId === parentId);
  if (duplicate) { res.status(400).json({ error: "این اتصال قبلاً برقرار شده است" }); return; }

  const createdBy = (req as any).session?.userId ?? null;
  const [created] = await db.insert(parentStudentsTable).values({
    parentId, studentId,
    relationType: relationType ?? "guardian",
    notes: notes ?? null,
    createdBy,
  }).returning();
  res.status(201).json(created);
});

// PATCH /parent-students/:id
router.patch("/parent-students/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { relationType, notes, isActive } = req.body;
  const updates: any = { updatedAt: new Date() };
  if (relationType !== undefined) updates.relationType = relationType;
  if (notes !== undefined) updates.notes = notes;
  if (isActive !== undefined) updates.isActive = isActive;
  const [updated] = await db.update(parentStudentsTable).set(updates).where(eq(parentStudentsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "اتصال یافت نشد" }); return; }
  res.json(updated);
});

// DELETE /parent-students/:id — soft delete
router.delete("/parent-students/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(parentStudentsTable).set({ isActive: false, updatedAt: new Date() }).where(eq(parentStudentsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "اتصال یافت نشد" }); return; }
  res.json({ success: true });
});

export default router;
