import { Router } from "express";
import { db } from "@workspace/db";
import { studentBooksTable, booksTable, bookOrdersTable, bookOrderItemsTable, classBooksTable, classStudentsTable } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

// GET /student-books?studentId=&schoolId=&bookId=&activeOnly=
router.get("/student-books", async (req, res) => {
  const { studentId, schoolId, bookId, activeOnly } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (activeOnly !== "false") conditions.push(eq(studentBooksTable.isActive, true));
  if (studentId) conditions.push(eq(studentBooksTable.studentId, parseInt(studentId)));
  if (schoolId) conditions.push(eq(studentBooksTable.schoolId, parseInt(schoolId)));
  if (bookId) conditions.push(eq(studentBooksTable.bookId, parseInt(bookId)));

  const rows = await db.select().from(studentBooksTable)
    .where(conditions.length ? and(...conditions) : undefined);

  // Enrich with book info
  const bookIds = [...new Set(rows.map(r => r.bookId))];
  const books = bookIds.length > 0
    ? await db.select().from(booksTable).where(inArray(booksTable.id, bookIds))
    : [];
  const bookMap = Object.fromEntries(books.map(b => [b.id, b]));

  res.json(rows.map(r => ({ ...r, book: bookMap[r.bookId] ?? null })));
});

// POST /student-books — assign a book to a student (checks license availability)
router.post("/student-books", async (req, res) => {
  const { studentId, bookId, schoolId, notes } = req.body as {
    studentId: number; bookId: number; schoolId: number; notes?: string;
  };
  if (!studentId || !bookId || !schoolId) {
    res.status(400).json({ error: "studentId، bookId و schoolId الزامی است" }); return;
  }

  // Check if already assigned
  const existing = await db.select().from(studentBooksTable).where(
    and(eq(studentBooksTable.studentId, studentId), eq(studentBooksTable.bookId, bookId))
  );
  if (existing.length > 0) {
    if (existing[0].isActive) { res.status(400).json({ error: "این کتاب قبلاً به این دانش‌آموز تخصیص داده شده است" }); return; }
    // Reactivate
    const [updated] = await db.update(studentBooksTable)
      .set({ isActive: true, notes: notes ?? null, updatedAt: new Date() })
      .where(eq(studentBooksTable.id, existing[0].id))
      .returning();
    res.status(201).json(updated); return;
  }

  // Check license availability: purchased vs. used (class + direct)
  const paidOrders = await db.select({ id: bookOrdersTable.id }).from(bookOrdersTable)
    .where(and(eq(bookOrdersTable.schoolId, schoolId), eq(bookOrdersTable.status, "paid")));
  const paidOrderIds = paidOrders.map(o => o.id);

  let purchased = 0;
  if (paidOrderIds.length > 0) {
    const items = await db.select().from(bookOrderItemsTable)
      .where(and(inArray(bookOrderItemsTable.orderId, paidOrderIds), eq(bookOrderItemsTable.bookId, bookId)));
    purchased = items.reduce((s, i) => s + i.quantity, 0);
  }

  if (purchased === 0) {
    res.status(400).json({ error: "مدرسه هیچ لایسنسی از این کتاب خریداری نکرده است" }); return;
  }

  // Count used (class-based + direct assignments for this book in this school)
  const directRows = await db.select({ studentId: studentBooksTable.studentId }).from(studentBooksTable)
    .where(and(eq(studentBooksTable.schoolId, schoolId), eq(studentBooksTable.bookId, bookId), eq(studentBooksTable.isActive, true)));
  const directStudents = new Set(directRows.map(r => r.studentId));

  // Also count via classes
  const { branchesTable, gradeLevelsTable, gradesTable, classesTable } = await import("@workspace/db");
  const branches = await db.select({ id: branchesTable.id }).from(branchesTable).where(eq(branchesTable.schoolId, schoolId));
  const branchIds = branches.map(b => b.id);
  let classStudents: number[] = [];
  if (branchIds.length > 0) {
    const gls = await db.select({ id: gradeLevelsTable.id }).from(gradeLevelsTable).where(inArray(gradeLevelsTable.branchId, branchIds));
    const glIds = gls.map(g => g.id);
    if (glIds.length > 0) {
      const grades = await db.select({ id: gradesTable.id }).from(gradesTable).where(inArray(gradesTable.gradeLevelId, glIds));
      const gradeIds = grades.map(g => g.id);
      if (gradeIds.length > 0) {
        const classes = await db.select({ id: classesTable.id }).from(classesTable).where(inArray(classesTable.gradeId, gradeIds));
        const classIds = classes.map(c => c.id);
        if (classIds.length > 0) {
          const cbRows = await db.select({ classId: classBooksTable.classId }).from(classBooksTable)
            .where(and(inArray(classBooksTable.classId, classIds), eq(classBooksTable.bookId, bookId)));
          const bookClassIds = cbRows.map(r => r.classId);
          if (bookClassIds.length > 0) {
            const csRows = await db.select({ studentId: classStudentsTable.studentId }).from(classStudentsTable)
              .where(inArray(classStudentsTable.classId, bookClassIds));
            classStudents = csRows.map(r => r.studentId);
          }
        }
      }
    }
  }

  const allUsed = new Set([...directStudents, ...classStudents]);
  // The student we're assigning to might already be in allUsed (via class) — that's OK, no extra license needed
  const wouldAdd = !allUsed.has(studentId);
  const remaining = purchased - allUsed.size;

  if (wouldAdd && remaining <= 0) {
    res.status(400).json({ error: `لایسنس کافی وجود ندارد. خریداری‌شده: ${purchased} | استفاده‌شده: ${allUsed.size}` }); return;
  }

  const assignedBy = (req as any).session?.userId ?? null;
  const [created] = await db.insert(studentBooksTable).values({
    studentId, bookId, schoolId, notes: notes ?? null, assignedBy,
  }).returning();
  res.status(201).json(created);
});

// DELETE /student-books/:id — soft delete (returns license)
router.delete("/student-books/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(studentBooksTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(studentBooksTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "تخصیص یافت نشد" }); return; }
  res.json({ success: true });
});

export default router;
