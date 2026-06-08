import webpush from "web-push";
import { db, pushSubscriptionsTable, usersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./logger";

let pushReady = false;

try {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (pub && priv) {
    webpush.setVapidDetails("mailto:admin@okidd.com", pub, priv);
    pushReady = true;
  }
} catch { /* skip */ }

export async function sendPushToUsers(
  userIds: number[],
  payload: { title: string; body: string; url?: string }
) {
  if (!pushReady || userIds.length === 0) return;

  const subs = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(inArray(pushSubscriptionsTable.userId, userIds));

  if (subs.length === 0) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(sub =>
      webpush
        .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, message)
        .catch((err: any) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            db.delete(pushSubscriptionsTable)
              .where(eq(pushSubscriptionsTable.endpoint, sub.endpoint))
              .catch(() => {});
          } else {
            logger.warn({ err: err?.message, sub: sub.endpoint }, "push send failed");
          }
        })
    )
  );
}

export async function sendPushForNotification(notif: {
  schoolId: number;
  targetRole: string;
  targetUserId?: number | null;
  title: string;
  body: string;
}) {
  if (!pushReady) return;

  let userIds: number[] = [];

  if (notif.targetUserId) {
    userIds = [notif.targetUserId];
  } else {
    const rows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.schoolId, notif.schoolId));
    userIds = rows
      .filter((u: any) => u.id !== null)
      .map((u: any) => u.id as number);
  }

  await sendPushToUsers(userIds, {
    title: notif.title,
    body: notif.body,
    url: "/",
  });
}

export { pushReady };
