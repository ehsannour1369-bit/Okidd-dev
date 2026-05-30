import { Router } from "express";
import { db, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/books", async (req, res) => {
  const books = await db.select().from(booksTable);
  res.json(books.map(b => ({ ...b, monthlyFee: parseFloat(String(b.monthlyFee)) })));
});

router.post("/books", async (req, res) => {
  const [book] = await db.insert(booksTable).values(req.body).returning();
  res.status(201).json({ ...book, monthlyFee: parseFloat(String(book.monthlyFee)) });
});

router.get("/books/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
  if (!book) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...book, monthlyFee: parseFloat(String(book.monthlyFee)) });
});

router.put("/books/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [book] = await db.update(booksTable).set(req.body).where(eq(booksTable.id, id)).returning();
  if (!book) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...book, monthlyFee: parseFloat(String(book.monthlyFee)) });
});

router.delete("/books/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(booksTable).where(eq(booksTable.id, id));
  res.status(204).end();
});

export default router;
