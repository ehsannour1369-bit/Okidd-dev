import { Router } from "express";
import { db, booksTable, lessonsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function ensureLessons(bookId: number, lessonCount: number) {
  const existing = await db.select().from(lessonsTable).where(eq(lessonsTable.bookId, bookId));
  if (existing.length === 0 && lessonCount > 0) {
    const rows = Array.from({ length: lessonCount }, (_, i) => ({
      bookId,
      title: `\u062f\u0631\u0633 ${i + 1}`,
      orderIndex: i + 1,
    }));
    await db.insert(lessonsTable).values(rows);
  } else if (existing.length < lessonCount) {
    const rows = Array.from({ length: lessonCount - existing.length }, (_, i) => ({
      bookId,
      title: `\u062f\u0631\u0633 ${existing.length + i + 1}`,
      orderIndex: existing.length + i + 1,
    }));
    await db.insert(lessonsTable).values(rows);
  } else if (existing.length > lessonCount) {
    const toDelete = existing.slice(lessonCount);
    for (const l of toDelete) {
      await db.delete(lessonsTable).where(eq(lessonsTable.id, l.id));
    }
  }
}

router.get("/books", async (req, res) => {
  const books = await db.select().from(booksTable);
  res.json(books.map(b => ({ ...b, monthlyFee: parseFloat(String(b.monthlyFee)), price: parseFloat(String(b.price ?? 0)) })));
});

router.post("/books", async (req, res) => {
  const [book] = await db.insert(booksTable).values(req.body).returning();
  const lessonCount = book.lessonCount ?? 0;
  if (lessonCount > 0) await ensureLessons(book.id, lessonCount);
  res.status(201).json({ ...book, monthlyFee: parseFloat(String(book.monthlyFee)), price: parseFloat(String(book.price ?? 0)) });
});

router.post("/books/fix-lessons", async (_req, res) => {
  const books = await db.select().from(booksTable);
  let created = 0;
  for (const b of books) {
    const count = b.lessonCount ?? 0;
    if (count > 0) {
      const existing = await db.select().from(lessonsTable).where(eq(lessonsTable.bookId, b.id));
      if (existing.length === 0) {
        const rows = Array.from({ length: count }, (_, i) => ({
          bookId: b.id,
          title: `\u062f\u0631\u0633 ${i + 1}`,
          orderIndex: i + 1,
        }));
        await db.insert(lessonsTable).values(rows);
        created += count;
      }
    }
  }
  res.json({ message: "Done", createdLessons: created });
});

router.get("/books/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
  if (!book) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...book, monthlyFee: parseFloat(String(book.monthlyFee)), price: parseFloat(String(book.price ?? 0)) });
});

router.put("/books/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [book] = await db.update(booksTable).set(req.body).where(eq(booksTable.id, id)).returning();
  if (!book) { res.status(404).json({ error: "Not found" }); return; }
  const lessonCount = req.body.lessonCount !== undefined ? req.body.lessonCount : book.lessonCount ?? 0;
  if (lessonCount > 0) await ensureLessons(book.id, lessonCount);
  res.json({ ...book, monthlyFee: parseFloat(String(book.monthlyFee)), price: parseFloat(String(book.price ?? 0)) });
});

router.delete("/books/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(booksTable).where(eq(booksTable.id, id));
  res.status(204).end();
});

export default router;
