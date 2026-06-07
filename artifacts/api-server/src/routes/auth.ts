import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable, branchManagersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is required");
  return secret;
}

function signToken(payload: { id: number; email: string; role: string; tokenVersion: number }): string {
  return jwt.sign(
    { sub: String(payload.id), email: payload.email, role: payload.role, tv: payload.tokenVersion },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): { id: number; email: string; role: string; tokenVersion: number } {
  const decoded = jwt.verify(token, getJwtSecret()) as { sub: string; email: string; role: string; tv?: number };
  return {
    id: parseInt(decoded.sub),
    email: decoded.email,
    role: decoded.role,
    tokenVersion: decoded.tv ?? 1,
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyToken(auth.slice(7));
    (req as any).userId = payload.id;
    (req as any).userRole = payload.role;
    (req as any).userEmail = payload.email;

    // For non-admin roles: verify tokenVersion matches DB (single-session enforcement)
    if (payload.role !== "admin") {
      const [user] = await db
        .select({ tokenVersion: usersTable.tokenVersion })
        .from(usersTable)
        .where(eq(usersTable.id, payload.id))
        .limit(1);

      if (!user || user.tokenVersion !== payload.tokenVersion) {
        res.status(401).json({ error: "Session expired. Please log in again." });
        return;
      }
    }

    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

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

  // For non-admin: increment tokenVersion to invalidate all previous sessions
  let tokenVersion = user.tokenVersion ?? 1;
  if (user.role !== "admin") {
    tokenVersion = tokenVersion + 1;
    await db
      .update(usersTable)
      .set({ tokenVersion, lastLoginAt: new Date() } as any)
      .where(eq(usersTable.id, user.id));
  } else {
    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() } as any)
      .where(eq(usersTable.id, user.id));
  }

  let branchId: number | null = null;
  if (user.role === "branch_manager") {
    const bm = await db.select().from(branchManagersTable).where(
      and(eq(branchManagersTable.userId, user.id), eq(branchManagersTable.isActive, true))
    ).limit(1);
    branchId = bm[0]?.branchId ?? null;
  }

  const token = signToken({ id: user.id, email: user.email!, role: user.role!, tokenVersion });
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
    const payload = verifyToken(auth.slice(7));
    const users = await db.select().from(usersTable).where(eq(usersTable.id, payload.id)).limit(1);
    const user = users[0];
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Single-session check for non-admin
    if (user.role !== "admin" && user.tokenVersion !== payload.tokenVersion) {
      res.status(401).json({ error: "Session expired. Please log in again." });
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
