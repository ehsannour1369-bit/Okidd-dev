import { Router } from "express";
import { db, notificationsTable, parentStudentsTable, usersTable } from "@workspace/db";
import { notificationRepliesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "./auth";

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

/* ── Notification Replies ── */

router.get("/notifications/:id/replies", async (req, res) => {
  const notificationId = parseInt(req.params.id);
  const rows = await db
    .select()
    .from(notificationRepliesTable)
    .where(eq(notificationRepliesTable.notificationId, notificationId));
  rows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(rows);
});

router.post("/notifications/:id/replies", async (req, res) => {
  const notificationId = parseInt(req.params.id);
  const [reply] = await db
    .insert(notificationRepliesTable)
    .values({ ...req.body, notificationId })
    .returning();
  res.status(201).json(reply);
});

const TYPE_LABELS: Record<string, string> = {
  animation: "انیمیشن", video: "ویدیو", game: "بازی",
  quiz: "آزمونک", exercise: "تکالیف", pdf: "PDF",
};

router.post("/notifications/student-activity", async (req, res) => {
  const authHeader = req.headers.authorization;
  const bodyToken  = req.body?.token;
  const tokenStr   = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : bodyToken;
  if (!tokenStr) { res.status(401).json({ error: "Unauthorized" }); return; }

  let userId: number;
  try {
    const payload = verifyToken(tokenStr);
    userId = payload.id;
  } catch {
    res.status(401).json({ error: "Invalid token" }); return;
  }

  const { action, lessonTitle, contentType } = req.body ?? {};
  if (action !== "started" && action !== "stopped") {
    res.status(400).json({ error: "action must be started or stopped" }); return;
  }

  const [student] = await db
    .select({ name: usersTable.name, schoolId: usersTable.schoolId })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!student?.schoolId) { res.json({ ok: true }); return; }

  const parents = await db
    .select({ parentId: parentStudentsTable.parentId })
    .from(parentStudentsTable)
    .where(eq(parentStudentsTable.studentId, userId));

  if (parents.length === 0) { res.json({ ok: true }); return; }

  const title = action === "started" ? "📚 شروع یادگیری" : "⏸️ توقف یادگیری";
  const lessonPart = lessonTitle ? ` درس «${lessonTitle}» را` : "";
  const typePart = contentType ? ` (${TYPE_LABELS[contentType] ?? contentType})` : "";
  const body = action === "started"
    ? `${student.name}${lessonPart}${typePart} شروع کرد`
    : `${student.name}${lessonPart} متوقف کرد`;

  await Promise.all(
    parents.map(p =>
      db.insert(notificationsTable).values({
        schoolId: student.schoolId!,
        title,
        body,
        targetRole: "parent",
        targetUserId: p.parentId,
        senderId: userId,
      })
    )
  );

  res.json({ ok: true });
});

export default router;
