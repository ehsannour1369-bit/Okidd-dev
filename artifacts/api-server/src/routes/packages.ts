import { Router } from "express";
import {
  db, packagesTable, packageBooksTable, booksTable,
  branchesTable, gradeLevelsTable, gradesTable, classesTable,
  classBooksTable, classStudentsTable, bookLicenseTransactionsTable,
} from "@workspace/db";
import { eq, inArray, sum } from "drizzle-orm";

const router = Router();

async function enrichPackage(pkg: typeof packagesTable.$inferSelect) {
  const pbRows = await db.select().from(packageBooksTable).where(eq(packageBooksTable.packageId, pkg.id));
  return {
    ...pkg,
    totalPrice: parseFloat(String(pkg.totalPrice)),
    books: pbRows.map(r => ({ bookId: r.bookId, quantity: r.quantity })),
    bookIds: pbRows.map(r => r.bookId),
  };
}

router.get("/packages", async (req, res) => {
  const { schoolId } = req.query as Record<string, string>;
  let rows = await db.select().from(packagesTable);
  if (schoolId) rows = rows.filter(p => p.schoolId === parseInt(schoolId));
  res.json(await Promise.all(rows.map(enrichPackage)));
});

router.post("/packages", async (req, res) => {
  const { books, bookIds, ...rest } = req.body;
  const [pkg] = await db.insert(packagesTable).values(rest).returning();
  const bookEntries = books ?? (bookIds?.map((id: number) => ({ bookId: id, quantity: 0 })) ?? []);
  if (bookEntries.length > 0) {
    await db.insert(packageBooksTable).values(
      bookEntries.map((b: { bookId: number; quantity: number }) => ({
        packageId: pkg.id, bookId: b.bookId, quantity: b.quantity ?? 0,
      }))
    );
  }
  res.status(201).json(await enrichPackage(pkg));
});

router.get("/packages/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, id));
  if (!pkg) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichPackage(pkg));
});

router.put("/packages/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { books, bookIds, ...rest } = req.body;
  const [pkg] = await db.update(packagesTable).set(rest).where(eq(packagesTable.id, id)).returning();
  if (!pkg) { res.status(404).json({ error: "Not found" }); return; }
  const bookEntries = books ?? (bookIds !== undefined ? bookIds.map((bid: number) => ({ bookId: bid, quantity: 0 })) : undefined);
  if (bookEntries !== undefined) {
    await db.delete(packageBooksTable).where(eq(packageBooksTable.packageId, id));
    if (bookEntries.length > 0) {
      await db.insert(packageBooksTable).values(
        bookEntries.map((b: { bookId: number; quantity: number }) => ({
          packageId: id, bookId: b.bookId, quantity: b.quantity ?? 0,
        }))
      );
    }
  }
  res.json(await enrichPackage(pkg));
});

router.delete("/packages/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(packageBooksTable).where(eq(packageBooksTable.packageId, id));
  await db.delete(packagesTable).where(eq(packagesTable.id, id));
  res.status(204).end();
});

/* ─── Book License Summary ───────────────────────────────────────────────
 * GET /book-license-summary?schoolId=X[&branchId=Y]
 * Returns per-book: purchased, used, remaining
 *
 * purchased = SUM(package_books.quantity) for all packages of this school
 * used      = number of distinct students enrolled in school's classes
 *             that have this book assigned via class_books
 * ─────────────────────────────────────────────────────────────────────── */
router.get("/book-license-summary", async (req, res) => {
  const { schoolId, branchId } = req.query as Record<string, string>;
  if (!schoolId) { res.status(400).json({ error: "schoolId required" }); return; }
  const sid = parseInt(schoolId);
  const bid = branchId ? parseInt(branchId) : null;

  // 1. Purchased: SUM from book_license_transactions (real paid transactions only)
  const purchased: Record<number, number> = {};
  const txRows = await db.select().from(bookLicenseTransactionsTable)
    .where(eq(bookLicenseTransactionsTable.schoolId, sid));
  for (const row of txRows) {
    purchased[row.bookId] = (purchased[row.bookId] ?? 0) + row.quantity;
  }

  // 2. All classes for this school (optionally filtered to one branch)
  //    chain: branches → grade_levels → grades → classes
  const branchFilter = bid
    ? [{ id: bid }]
    : await db.select({ id: branchesTable.id }).from(branchesTable).where(eq(branchesTable.schoolId, sid));
  const branchIds = branchFilter.map(b => b.id);

  let classIds: number[] = [];
  if (branchIds.length > 0) {
    const gls = await db.select({ id: gradeLevelsTable.id }).from(gradeLevelsTable)
      .where(inArray(gradeLevelsTable.branchId, branchIds));
    const glIds = gls.map(g => g.id);
    if (glIds.length > 0) {
      const grades = await db.select({ id: gradesTable.id }).from(gradesTable)
        .where(inArray(gradesTable.gradeLevelId, glIds));
      const gradeIds = grades.map(g => g.id);
      if (gradeIds.length > 0) {
        const classes = await db.select({ id: classesTable.id }).from(classesTable)
          .where(inArray(classesTable.gradeId, gradeIds));
        classIds = classes.map(c => c.id);
      }
    }
  }

  // 3. Used: for each book, count distinct students in classes that have the book
  const used: Record<number, number> = {};
  if (classIds.length > 0) {
    const cbRows = await db.select().from(classBooksTable).where(inArray(classBooksTable.classId, classIds));
    const csRows = await db.select().from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds));
    // Build classId → studentIds map
    const classStudents: Record<number, Set<number>> = {};
    for (const cs of csRows) {
      if (!classStudents[cs.classId]) classStudents[cs.classId] = new Set();
      classStudents[cs.classId].add(cs.studentId);
    }
    // For each book: collect all students across classes that have the book
    const bookStudents: Record<number, Set<number>> = {};
    for (const cb of cbRows) {
      if (!bookStudents[cb.bookId]) bookStudents[cb.bookId] = new Set();
      const studs = classStudents[cb.classId] ?? new Set();
      for (const s of studs) bookStudents[cb.bookId].add(s);
    }
    for (const [bookId, studs] of Object.entries(bookStudents)) {
      used[Number(bookId)] = studs.size;
    }
  }

  // 4. Gather all book IDs that appear in either purchased or used
  const allBookIds = [...new Set([...Object.keys(purchased), ...Object.keys(used)].map(Number))];
  if (allBookIds.length === 0) { res.json([]); return; }

  const books = await db.select().from(booksTable).where(inArray(booksTable.id, allBookIds));
  const bookMap = Object.fromEntries(books.map(b => [b.id, b]));

  const result = allBookIds.map(bookId => {
    const p = purchased[bookId] ?? 0;
    const u = used[bookId] ?? 0;
    return {
      bookId,
      bookTitle: bookMap[bookId]?.title ?? `کتاب ${bookId}`,
      purchased: p,
      used: u,
      remaining: Math.max(0, p - u),
    };
  }).sort((a, b) => a.bookTitle.localeCompare(b.bookTitle, "fa"));

  res.json(result);
});

export default router;
