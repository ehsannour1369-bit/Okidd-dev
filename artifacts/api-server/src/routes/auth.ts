import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  // Track last login time
  await db.update(usersTable).set({ lastLoginAt: new Date() } as any).where(eq(usersTable.id, user.id));

  const token = Buffer.from(`${user.id}:${user.email}:${user.role}`).toString("base64");
  const { password: _pw, ...safeUser } = user;
  res.json({ user: { ...safeUser, lastLoginAt: new Date().toISOString() }, token });
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
    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
