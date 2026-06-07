import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable, branchManagersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

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

    // Admin: no session restriction
    if (payload.role === "admin") {
      next();
      return;
    }

    // Non-admin: check tokenVersion matches AND account is active
    const [user] = await db
      .select({ tokenVersion: usersTable.tokenVersion, status: usersTable.status })
      .from(usersTable)
      .where(eq(usersTable.id, payload.id))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (user.status === "locked") {
      res.status(423).json({ error: "account_locked" });
      return;
    }
    if (user.status !== "active" || user.tokenVersion !== payload.tokenVersion) {
      res.status(401).json({ error: "Session expired. Please log in again." });
      return;
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

  // Locked accounts cannot log in at all
  if (user.status === "locked") {
    res.status(423).json({ error: "account_locked", message: "اکانت شما قفل شده است. لطفاً با مدیر سیستم تماس بگیرید." });
    return;
  }

  if (user.status !== "active") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Non-admin: if tokenVersion > 0, user is already logged in somewhere → lock account
  if (user.role !== "admin" && (user.tokenVersion ?? 0) > 0) {
    await db
      .update(usersTable)
      .set({ status: "locked", tokenVersion: 0 } as any)
      .where(eq(usersTable.id, user.id));
    res.status(423).json({
      error: "account_locked",
      message: "اکانت شما به دلیل ورود از دستگاه دیگر قفل شد. لطفاً با مدیر سیستم تماس بگیرید.",
    });
    return;
  }

  // Set tokenVersion = 1 for non-admin (marks session as active)
  let tokenVersion = user.tokenVersion ?? 0;
  if (user.role !== "admin") {
    tokenVersion = 1;
    await db
      .update(usersTable)
      .set({ tokenVersion: 1, lastLoginAt: new Date() } as any)
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
    if (user.status === "locked") {
      res.status(423).json({ error: "account_locked" });
      return;
    }
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
