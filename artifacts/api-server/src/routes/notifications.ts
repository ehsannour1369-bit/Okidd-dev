import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/notifications", async (req, res) => {
  const { schoolId, targetRole, senderId, targetUserId } = req.query as Record<string, string>;
  let rows = await db.select().from(notificationsTable);
  if (schoolId) rows = rows.filter(n => n.schoolId === parseInt(schoolId));
  if (targetRole) rows = rows.filter(n => n.targetRole === targetRole);
  if (senderId) rows = rows.filter(n => n.senderId === parseInt(senderId));
  if (targetUserId) rows = rows.filter(n => n.targetUserId === parseInt(targetUserId));
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(rows);
});

router.post("/notifications", async (req, res) => {
  const [notification] = await db.insert(notificationsTable).values(req.body).returning();
  res.status(201).json(notification);
});

router.delete("/notifications/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
  res.status(204).end();
});

export default router;
