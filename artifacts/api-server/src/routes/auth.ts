import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { db, usersTable, branchManagersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // max 5 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts", message: "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره امتحان کنید." },
  skipSuccessfulRequests: true, // successful logins don't count against limit
});

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
    if (user.status === "suspended") {
      res.status(403).json({ error: "account_suspended" });
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

/** Convert Persian/Arabic-Indic digits to ASCII digits */
function toEnDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));
}

/**
 * Normalise a login identifier:
 * - always converts Persian/Arabic digits to English
 * - if it looks like a phone number, converts to 09XXXXXXXXXX format:
 *     +989XXXXXXXX  → 09XXXXXXXXX
 *     00989XXXXXXXX → 09XXXXXXXXX
 *     989XXXXXXXX   → 09XXXXXXXXX  (10 digits after 98)
 *     9XXXXXXXXX    → 09XXXXXXXXX  (10-digit without leading 0)
 * - emails are returned as-is (lower-cased)
 */
function normalizeUsername(raw: string): string {
  const s = toEnDigits(raw.trim());
  // Looks like an e-mail — keep it lowercase
  if (s.includes("@")) return s.toLowerCase();
  // Strip common prefixes for phone numbers
  let phone = s.replace(/\s|-/g, "");
  if (phone.startsWith("+98"))  phone = "0" + phone.slice(3);
  else if (phone.startsWith("0098")) phone = "0" + phone.slice(4);
  else if (phone.startsWith("98") && phone.length === 12) phone = "0" + phone.slice(2);
  else if (phone.startsWith("9")  && phone.length === 10) phone = "0" + phone;
  return phone;
}

router.post("/auth/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const normalizedUsername = normalizeUsername(String(username));

  let users = await db.select().from(usersTable).where(eq(usersTable.email, normalizedUsername)).limit(1);
  let user = users[0];

  if (!user) {
    const phoneUsers = await db.select().from(usersTable).where(eq(usersTable.phone, normalizedUsername)).limit(1);
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

  // Non-admin: increment tokenVersion to invalidate any existing session on another device
  let tokenVersion = user.tokenVersion ?? 0;
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

router.post("/auth/report-violation", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const role = (req as any).userRole;
  if (role === "admin") {
    res.json({ ok: true });
    return;
  }
  await db
    .update(usersTable)
    .set({ status: "suspended", tokenVersion: 0 } as any)
    .where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

export default router;
