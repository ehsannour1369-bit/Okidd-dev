import { Router } from "express";
import { db, contentTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/** Allowed MIME types for uploads */
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogv",
  "audio/mpeg": ".mp3",
  "audio/ogg": ".ogg",
  "audio/wav": ".wav",
  "application/pdf": ".pdf",
  "application/zip": ".zip",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/html": ".html",
  "application/octet-stream": ".html",
};

const ALLOWED_ROLES = new Set(["admin", "school_manager", "branch_manager", "teacher"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME[file.mimetype]) {
      cb(null, true);
    } else if ((ext === ".html" || ext === ".htm") && file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error(`نوع فایل مجاز نیست: ${file.mimetype}`));
    }
  },
});

// ── Public: file serving — must be accessible without auth
//    because browsers can't add Authorization headers to <video src> / <img src>
export const contentFilesRouter = Router();
contentFilesRouter.get("/content/files/:filename", (req, res) => {
  // path.basename strips any directory traversal (e.g. "../../etc/passwd" → "passwd")
  const safe = path.basename(req.params.filename);
  // Additional guard: ensure resolved path is still inside uploadsDir
  const filePath = path.resolve(uploadsDir, safe);
  if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: "Not found" }); return; }
  res.sendFile(filePath);
});

// ── Protected: all other content routes require auth
const router = Router();

router.get("/content", async (req, res) => {
  const { lessonId, classId, bookId } = req.query as Record<string, string>;
  let rows = await db.select().from(contentTable);
  if (lessonId) rows = rows.filter(c => c.lessonId === parseInt(lessonId));
  if (classId) rows = rows.filter(c => c.classId === parseInt(classId));
  if (bookId) rows = rows.filter(c => c.bookId === parseInt(bookId));
  rows.sort((a, b) => a.orderIndex - b.orderIndex);
  res.json(rows);
});

router.post("/content/upload", (req, res, next) => {
  const role = (req as any).userRole;
  if (!ALLOWED_ROLES.has(role)) {
    res.status(403).json({ error: "دسترسی غیرمجاز: فقط مدیران و معلمان می‌توانند فایل آپلود کنند" });
    return;
  }
  next();
}, upload.single("file"), (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  const fileUrl = `/api/content/files/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename, originalName: req.file.originalname });
});

router.post("/content", async (req, res) => {
  const body = { ...req.body };
  if (body.lessonId) body.lessonId = parseInt(body.lessonId);
  if (body.bookId) body.bookId = parseInt(body.bookId);
  if (body.classId) body.classId = parseInt(body.classId);
  if (body.orderIndex) body.orderIndex = parseInt(body.orderIndex);
  const [content] = await db.insert(contentTable).values(body).returning();
  res.status(201).json(content);
});

router.put("/content/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = { ...req.body };
  if (body.lessonId !== undefined) body.lessonId = body.lessonId ? parseInt(body.lessonId) : null;
  if (body.bookId !== undefined) body.bookId = body.bookId ? parseInt(body.bookId) : null;
  if (body.classId !== undefined) body.classId = body.classId ? parseInt(body.classId) : null;
  if (body.orderIndex !== undefined) body.orderIndex = parseInt(body.orderIndex) || 1;
  const [content] = await db.update(contentTable).set(body).where(eq(contentTable.id, id)).returning();
  if (!content) { res.status(404).json({ error: "Not found" }); return; }
  res.json(content);
});

router.delete("/content/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(contentTable).where(eq(contentTable.id, id));
  res.status(204).end();
});

export default router;
