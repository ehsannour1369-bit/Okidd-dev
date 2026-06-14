import { Router } from "express";
import { db, notificationsTable, parentStudentsTable, usersTable } from "@workspace/db";
import { notificationRepliesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "./auth";
import { sendPushForNotification } from "../lib/push";

const router = Router();

router.get("/notifications", async (req, res) => {
  const { schoolId, targetRole, senderId, targetUserId, type, status } = req.query as Record<string, string>;
  let rows = await db.select().from(notificationsTable);
  if (schoolId) rows = rows.filter(n => n.schoolId === parseInt(schoolId));
  if (targetRole) rows = rows.filter(n => n.targetRole === targetRole);
  if (senderId) rows = rows.filter(n => n.senderId === parseInt(senderId));
  if (targetUserId) rows = rows.filter(n => n.targetUserId === parseInt(targetUserId));
  if (type) rows = rows.filter(n => n.type === type);
  if (status) rows = rows.filter(n => n.status === status);
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(rows);
});

router.post("/notifications", async (req, res) => {
  let status = "approved";
  if (req.body.senderId) {
    const [sender] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, req.body.senderId))
      .limit(1);
    if (sender?.role === "teacher") status = "pending";
  }

  const [notification] = await db
    .insert(notificationsTable)
    .values({ ...req.body, status })
    .returning();
  res.status(201).json(notification);

  if (status === "approved") {
    sendPushForNotification({
      schoolId: notification.schoolId,
      targetRole: notification.targetRole,
      targetUserId: notification.targetUserId,
      title: notification.title,
      body: notification.body,
    }).catch(() => {});
  }
});

router.patch("/notifications/:id/status", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body as { status: string };
  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "status باید approved یا rejected باشد" }); return;
  }
  const [updated] = await db
    .update(notificationsTable)
    .set({ status })
    .where(eq(notificationsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "اعلان پیدا نشد" }); return; }

  if (status === "approved") {
    sendPushForNotification({
      schoolId: updated.schoolId,
      targetRole: updated.targetRole,
      targetUserId: updated.targetUserId,
      title: updated.title,
      body: updated.body,
    }).catch(() => {});
  }

  res.json(updated);
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
        type: "activity",
        allowReply: false,
        status: "approved",
      })
    )
  );

  res.json({ ok: true });
});

export default router;
