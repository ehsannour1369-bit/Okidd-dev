import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, schoolTeachersTable, usersTable } from "@workspace/db";
import { eq, and, or, ilike, inArray } from "drizzle-orm";
import { maskUser } from "../lib/mask";

const router = Router();

// ─── Search users to add as teacher ───────────────────────────────────────────
router.get("/school-teachers/search", async (req, res) => {
  const { q, schoolId } = req.query as Record<string, string>;
  if (!q || q.length < 2) { res.json([]); return; }

  const users = await db.select().from(usersTable).where(
    and(
      eq(usersTable.role, "teacher"),
      or(
        ilike(usersTable.phone, `%${q}%`),
        ilike(usersTable.email, `%${q}%`),
        ilike(usersTable.nationalId, `%${q}%`),
        ilike(usersTable.name, `%${q}%`)
      )
    )
  );

  let existingTeacherIds: number[] = [];
  if (schoolId) {
    const existing = await db.select().from(schoolTeachersTable).where(eq(schoolTeachersTable.schoolId, parseInt(schoolId)));
    existingTeacherIds = existing.map(e => e.teacherId);
  }

  const result = users
    .filter(u => !existingTeacherIds.includes(u.id))
    .map(({ password: _pw, ...safe }) => maskUser(safe))
    .slice(0, 10);

  res.json(result);
});

// ─── List teachers for school ──────────────────────────────────────────────────
router.get("/school-teachers", async (req, res) => {
  const { schoolId } = req.query as Record<string, string>;
  if (!schoolId) { res.status(400).json({ error: "schoolId required" }); return; }

  const rows = await db.select().from(schoolTeachersTable).where(eq(schoolTeachersTable.schoolId, parseInt(schoolId)));
  if (rows.length === 0) { res.json([]); return; }

  const teacherIds = rows.map(r => r.teacherId);
  const users = await db.select().from(usersTable).where(inArray(usersTable.id, teacherIds));

  const result = users.map(u => {
    const { password: _pw, ...safe } = u;
    const stRow = rows.find(r => r.teacherId === u.id);
    return { ...safe, schoolTeacherId: stRow?.id };
  });

  res.json(result);
});

// ─── Add teacher to school (existing user or create new) ──────────────────────
router.post("/school-teachers", async (req, res) => {
  const { schoolId, teacherId, name, email, password, phone, nationalId, gender } = req.body;
  if (!schoolId) { res.status(400).json({ error: "schoolId required" }); return; }

  let finalTeacherId: number;

  if (teacherId) {
    finalTeacherId = Number(teacherId);
    await db.update(usersTable)
      .set({ role: "teacher", schoolId: Number(schoolId) } as any)
      .where(eq(usersTable.id, finalTeacherId));
  } else {
    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email and password are required" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(usersTable).values({
      name,
      email,
      password: hashed,
      phone: phone ?? null,
      nationalId: nationalId ?? null,
      gender: gender ?? "male",
      role: "teacher",
      schoolId: Number(schoolId),
      status: "active",
    } as any).returning();
    finalTeacherId = newUser.id;
  }

  let row: any;
  try {
    const rows = await db.insert(schoolTeachersTable).values({
      schoolId: Number(schoolId),
      teacherId: finalTeacherId,
    }).returning();
    row = rows[0];
  } catch (e: any) {
    if (e.code !== "23505") throw e;
    const existing = await db.select().from(schoolTeachersTable).where(
      and(eq(schoolTeachersTable.schoolId, Number(schoolId)), eq(schoolTeachersTable.teacherId, finalTeacherId))
    );
    row = existing[0];
  }

  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, finalTeacherId));
  const { password: _pw, ...safe } = u;
  res.status(201).json({ ...safe, schoolTeacherId: row?.id });
});

// ─── Remove teacher from school ────────────────────────────────────────────────
router.delete("/school-teachers", async (req, res) => {
  const { schoolId, teacherId } = req.query as Record<string, string>;
  if (!schoolId || !teacherId) { res.status(400).json({ error: "schoolId and teacherId required" }); return; }
  await db.delete(schoolTeachersTable).where(
    and(eq(schoolTeachersTable.schoolId, parseInt(schoolId)), eq(schoolTeachersTable.teacherId, parseInt(teacherId)))
  );
  res.status(204).end();
});

export default router;
