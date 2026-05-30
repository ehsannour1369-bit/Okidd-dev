import { Router } from "express";
import { db, consultationsTable, usersTable, consultantsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/consultations", async (req, res) => {
  const { parentId, consultantId, status } = req.query as Record<string, string>;
  let rows = await db.select().from(consultationsTable);
  if (parentId) rows = rows.filter(r => r.parentId === parseInt(parentId));
  if (consultantId) rows = rows.filter(r => r.consultantId === parseInt(consultantId));
  if (status) rows = rows.filter(r => r.status === status);
  const enriched = await Promise.all(rows.map(async c => {
    const [parent] = await db.select().from(usersTable).where(eq(usersTable.id, c.parentId));
    const [cons] = await db.select().from(consultantsTable).where(eq(consultantsTable.id, c.consultantId));
    const [consUser] = cons ? await db.select().from(usersTable).where(eq(usersTable.id, cons.userId)) : [null];
    return { ...c, parentName: parent?.name ?? null, parentEmail: parent?.email ?? null, consultantName: consUser?.name ?? null };
  }));
  res.json(enriched);
});

router.post("/consultations", async (req, res) => {
  const [row] = await db.insert(consultationsTable).values(req.body).returning();
  res.status(201).json(row);
});

router.put("/consultations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.update(consultationsTable).set(req.body).where(eq(consultationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/consultations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(consultationsTable).where(eq(consultationsTable.id, id));
  res.status(204).end();
});

export default router;
