import { Router } from "express";
import { db, consultantsTable, usersTable, schoolsTable, consultationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/consultants", async (req, res) => {
  const { schoolId, userId } = req.query as Record<string, string>;
  let rows = await db.select().from(consultantsTable);
  if (schoolId) rows = rows.filter(r => r.schoolId === parseInt(schoolId));
  if (userId) rows = rows.filter(r => r.userId === parseInt(userId));
  const enriched = await Promise.all(rows.map(async c => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, c.userId));
    const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, c.schoolId));
    return { ...c, userName: user?.name ?? null, userEmail: user?.email ?? null, schoolName: school?.name ?? null };
  }));
  res.json(enriched);
});

router.post("/consultants", async (req, res) => {
  const [row] = await db.insert(consultantsTable).values(req.body).returning();
  res.status(201).json(row);
});

router.put("/consultants/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.update(consultantsTable).set(req.body).where(eq(consultantsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/consultants/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(consultantsTable).where(eq(consultantsTable.id, id));
  res.status(204).end();
});

router.get("/consultants/:id/sessions", async (req, res) => {
  const id = parseInt(req.params.id);
  const rows = await db.select().from(consultationsTable).where(eq(consultationsTable.consultantId, id));
  const enriched = await Promise.all(rows.map(async c => {
    const [parent] = await db.select().from(usersTable).where(eq(usersTable.id, c.parentId));
    return { ...c, parentName: parent?.name ?? null };
  }));
  res.json(enriched);
});

export default router;
