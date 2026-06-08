import { Router } from "express";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/push-config", (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? "" });
});

router.post("/push-subscriptions", async (req, res) => {
  const { userId, endpoint, p256dh, auth } = req.body;
  if (!userId || !endpoint || !p256dh || !auth) {
    res.status(400).json({ error: "missing fields" });
    return;
  }
  const existing = await db
    .select({ id: pushSubscriptionsTable.id })
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.endpoint, endpoint));

  if (existing.length > 0) {
    await db
      .update(pushSubscriptionsTable)
      .set({ userId, p256dh, auth })
      .where(eq(pushSubscriptionsTable.endpoint, endpoint));
    res.json({ ok: true, updated: true });
    return;
  }

  await db.insert(pushSubscriptionsTable).values({ userId, endpoint, p256dh, auth });
  res.status(201).json({ ok: true });
});

router.delete("/push-subscriptions", async (req, res) => {
  const { userId, endpoint } = req.body;
  if (!userId && !endpoint) { res.status(400).json({ error: "missing fields" }); return; }
  if (endpoint) {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  } else {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userId, userId));
  }
  res.status(204).end();
});

export default router;
