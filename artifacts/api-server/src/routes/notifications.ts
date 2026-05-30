import { Router } from "express";
import { db, notificationsTable, notificationRepliesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/notifications", async (req, res) => {
  const { schoolId, targetRole, userId, fromUserId } = req.query as Record<string, string>;
  let rows = await db.select().from(notificationsTable);
  if (schoolId) rows = rows.filter(n => n.schoolId === parseInt(schoolId));
  if (targetRole) rows = rows.filter(n => n.targetRole === targetRole);
  if (fromUserId) rows = rows.filter(n => (n as any).fromUserId === parseInt(fromUserId));
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

// Replies
router.get("/notifications/:id/replies", async (req, res) => {
  const id = parseInt(req.params.id);
  const rows = await db.select().from(notificationRepliesTable).where(eq(notificationRepliesTable.notificationId, id));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/notifications/:id/replies", async (req, res) => {
  const id = parseInt(req.params.id);
  const [reply] = await db.insert(notificationRepliesTable).values({ ...req.body, notificationId: id }).returning();
  res.status(201).json({ ...reply, createdAt: reply.createdAt.toISOString() });
});

export default router;
