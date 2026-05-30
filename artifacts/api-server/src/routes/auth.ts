import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, branchManagersTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";

const router = Router();

// Username can be email or phone number
function looksLikePhone(input: string) {
  return /^\d{10,11}$/.test(input.replace(/^0/, ""));
}

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  // Try email first, then phone
  let users = await db.select().from(usersTable).where(eq(usersTable.email, username)).limit(1);
  let user = users[0];

  if (!user) {
    const phoneUsers = await db.select().from(usersTable).where(eq(usersTable.phone, username)).limit(1);
    user = phoneUsers[0];
  }

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  await db.update(usersTable).set({ lastLoginAt: new Date() } as any).where(eq(usersTable.id, user.id));

  // For branch_manager, include their active branchId
  let branchId: number | null = null;
  if (user.role === "branch_manager") {
    const bm = await db.select().from(branchManagersTable).where(
      and(eq(branchManagersTable.userId, user.id), eq(branchManagersTable.isActive, true))
    ).limit(1);
    branchId = bm[0]?.branchId ?? null;
  }

  const token = Buffer.from(`${user.id}:${user.email}:${user.role}`).toString("base64");
  const { password: _pw, ...safeUser } = user;
  res.json({ user: { ...safeUser, lastLoginAt: new Date().toISOString(), branchId }, token });
});

router.get("/auth/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString();
    const [idStr] = decoded.split(":");
    const id = parseInt(idStr);
    const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    const user = users[0];
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    let branchId: number | null = null;
    if (user.role === "branch_manager") {
      const bm = await db.select().from(branchManagersTable).where(
        and(eq(branchManagersTable.userId, user.id), eq(branchManagersTable.isActive, true))
      ).limit(1);
      branchId = bm[0]?.branchId ?? null;
    }
    const { password: _pw, ...safeUser } = user;
    res.json({ ...safeUser, branchId });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
