import { Router } from "express";
import { db, bookLicenseTransactionsTable, schoolsTable, booksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

/* GET /license-transactions?schoolId=X */
router.get("/license-transactions", async (req, res) => {
  const { schoolId } = req.query as Record<string, string>;
  let rows = await db.select().from(bookLicenseTransactionsTable)
    .orderBy(desc(bookLicenseTransactionsTable.createdAt));
  if (schoolId) rows = rows.filter(r => r.schoolId === parseInt(schoolId));

  const schools = await db.select({ id: schoolsTable.id, name: schoolsTable.name }).from(schoolsTable);
  const books = await db.select({ id: booksTable.id, title: booksTable.title }).from(booksTable);
  const schoolMap = Object.fromEntries(schools.map(s => [s.id, s.name]));
  const bookMap = Object.fromEntries(books.map(b => [b.id, b.title]));

  res.json(rows.map(r => ({
    ...r,
    schoolName: schoolMap[r.schoolId] ?? null,
    bookTitle: bookMap[r.bookId] ?? null,
  })));
});

/* POST /license-transactions — admin only */
router.post("/license-transactions", async (req, res) => {
  const { schoolId, bookId, quantity, trackingNumber, paymentDate, amount, notes } = req.body;
  if (!schoolId || !bookId || !quantity || !trackingNumber) {
    res.status(400).json({ error: "schoolId، bookId، quantity و trackingNumber الزامی هستند" });
    return;
  }
  if (Number(quantity) <= 0) {
    res.status(400).json({ error: "تعداد مجوز باید بیشتر از صفر باشد" });
    return;
  }

  // Check unique tracking number
  const existing = await db.select({ id: bookLicenseTransactionsTable.id })
    .from(bookLicenseTransactionsTable)
    .where(eq(bookLicenseTransactionsTable.trackingNumber, String(trackingNumber)));
  if (existing.length > 0) {
    res.status(409).json({ error: `شماره پیگیری «${trackingNumber}» قبلاً ثبت شده است. شماره پیگیری باید یکتا باشد.` });
    return;
  }

  const [row] = await db.insert(bookLicenseTransactionsTable).values({
    schoolId: parseInt(schoolId),
    bookId: parseInt(bookId),
    quantity: parseInt(quantity),
    trackingNumber: String(trackingNumber).trim(),
    paymentDate: paymentDate ?? null,
    amount: amount ? String(amount) : null,
    notes: notes ?? null,
  }).returning();

  const [school] = await db.select({ name: schoolsTable.name }).from(schoolsTable).where(eq(schoolsTable.id, row.schoolId));
  const [book] = await db.select({ title: booksTable.title }).from(booksTable).where(eq(booksTable.id, row.bookId));
  res.status(201).json({ ...row, schoolName: school?.name ?? null, bookTitle: book?.title ?? null });
});

/* DELETE /license-transactions/:id — admin only */
router.delete("/license-transactions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(bookLicenseTransactionsTable).where(eq(bookLicenseTransactionsTable.id, id));
  res.status(204).end();
});

export default router;
