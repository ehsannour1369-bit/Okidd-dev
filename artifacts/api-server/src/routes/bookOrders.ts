import { Router } from "express";
import { db, bookOrdersTable, bookOrderItemsTable, booksTable, schoolsTable, walletsTable, walletTransactionsTable } from "@workspace/db";
import { eq, inArray, and, desc, sum } from "drizzle-orm";

const router = Router();

async function enrichOrder(order: typeof bookOrdersTable.$inferSelect) {
  const items = await db.select().from(bookOrderItemsTable).where(eq(bookOrderItemsTable.orderId, order.id));
  const bookIds = items.map(i => i.bookId);
  const books = bookIds.length > 0 ? await db.select().from(booksTable).where(inArray(booksTable.id, bookIds)) : [];
  const bookMap = Object.fromEntries(books.map(b => [b.id, b]));
  return {
    ...order,
    discount: parseFloat(String(order.discount)),
    discountAmount: parseFloat(String(order.discountAmount)),
    totalAmount: parseFloat(String(order.totalAmount)),
    finalAmount: parseFloat(String(order.finalAmount)),
    items: items.map(i => ({
      ...i,
      unitPrice: parseFloat(String(i.unitPrice)),
      subtotal: parseFloat(String(i.subtotal)),
      bookTitle: bookMap[i.bookId]?.title ?? `کتاب ${i.bookId}`,
      bookPrice: parseFloat(String(bookMap[i.bookId]?.price ?? 0)),
    })),
  };
}

router.get("/book-orders", async (req, res) => {
  const { schoolId, status } = req.query as Record<string, string>;
  let rows = await db.select().from(bookOrdersTable).orderBy(desc(bookOrdersTable.createdAt));
  if (schoolId) rows = rows.filter(o => o.schoolId === parseInt(schoolId));
  if (status) rows = rows.filter(o => o.status === status);
  res.json(await Promise.all(rows.map(enrichOrder)));
});

router.get("/book-orders/:id", async (req, res) => {
  const [order] = await db.select().from(bookOrdersTable).where(eq(bookOrdersTable.id, parseInt(req.params.id)));
  if (!order) { res.status(404).json({ error: "سفارش یافت نشد" }); return; }
  res.json(await enrichOrder(order));
});

router.post("/book-orders", async (req, res) => {
  const { items, ...rest } = req.body as {
    schoolId: number;
    trackingNumber: string;
    discount?: number;
    paymentMethod?: string;
    notes?: string;
    items: { bookId: number; quantity: number }[];
  };

  if (!items || items.length === 0) {
    res.status(400).json({ error: "حداقل یک کتاب باید انتخاب شود" });
    return;
  }

  // Duplicate tracking number check
  const [existing] = await db.select({ id: bookOrdersTable.id })
    .from(bookOrdersTable).where(eq(bookOrdersTable.trackingNumber, rest.trackingNumber));
  if (existing) {
    res.status(409).json({ error: `شماره پیگیری «${rest.trackingNumber}» قبلاً ثبت شده است` });
    return;
  }

  // Fetch book prices
  const bookIds = items.map(i => i.bookId);
  const books = await db.select().from(booksTable).where(inArray(booksTable.id, bookIds));
  const bookMap = Object.fromEntries(books.map(b => [b.id, b]));

  // Calculate totals
  const itemsWithPrice = items.map(i => {
    const unitPrice = parseFloat(String(bookMap[i.bookId]?.price ?? 0));
    return { ...i, unitPrice, subtotal: unitPrice * i.quantity };
  });
  const totalAmount = itemsWithPrice.reduce((s, i) => s + i.subtotal, 0);
  const discountPct = parseFloat(String(rest.discount ?? 0));
  const discountAmount = Math.round(totalAmount * discountPct / 100);
  const finalAmount = totalAmount - discountAmount;

  const [order] = await db.insert(bookOrdersTable).values({
    ...rest,
    discount: String(discountPct),
    discountAmount: String(discountAmount),
    totalAmount: String(totalAmount),
    finalAmount: String(finalAmount),
    status: rest.paymentMethod ? "pending" : "pending",
  }).returning();

  await db.insert(bookOrderItemsTable).values(
    itemsWithPrice.map(i => ({
      orderId: order.id,
      bookId: i.bookId,
      quantity: i.quantity,
      unitPrice: String(i.unitPrice),
      subtotal: String(i.subtotal),
    }))
  );

  res.status(201).json(await enrichOrder(order));
});

router.put("/book-orders/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { items, ...rest } = req.body;

  // If updating items, recalculate totals
  if (items && items.length > 0) {
    const bookIds = items.map((i: { bookId: number }) => i.bookId);
    const books = await db.select().from(booksTable).where(inArray(booksTable.id, bookIds));
    const bookMap = Object.fromEntries(books.map(b => [b.id, b]));
    const itemsWithPrice = items.map((i: { bookId: number; quantity: number }) => {
      const unitPrice = parseFloat(String(bookMap[i.bookId]?.price ?? 0));
      return { ...i, unitPrice, subtotal: unitPrice * i.quantity };
    });
    const totalAmount = itemsWithPrice.reduce((s: number, i: { subtotal: number }) => s + i.subtotal, 0);
    const discountPct = parseFloat(String(rest.discount ?? 0));
    const discountAmount = Math.round(totalAmount * discountPct / 100);
    const finalAmount = totalAmount - discountAmount;

    rest.totalAmount = String(totalAmount);
    rest.discountAmount = String(discountAmount);
    rest.finalAmount = String(finalAmount);

    await db.delete(bookOrderItemsTable).where(eq(bookOrderItemsTable.orderId, id));
    await db.insert(bookOrderItemsTable).values(
      itemsWithPrice.map((i: { bookId: number; quantity: number; unitPrice: number; subtotal: number }) => ({
        orderId: id, bookId: i.bookId, quantity: i.quantity,
        unitPrice: String(i.unitPrice), subtotal: String(i.subtotal),
      }))
    );
  }

  const [order] = await db.update(bookOrdersTable).set({ ...rest, updatedAt: new Date() })
    .where(eq(bookOrdersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "سفارش یافت نشد" }); return; }

  // If marking as paid via wallet, debit wallet
  if (rest.status === "paid" && rest.paymentMethod === "wallet") {
    const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.schoolId, order.schoolId));
    if (wallet) {
      const newBal = parseFloat(String(wallet.balance)) - parseFloat(String(order.finalAmount));
      await db.update(walletsTable).set({ balance: String(Math.max(0, newBal)) }).where(eq(walletsTable.id, wallet.id));
      await db.insert(walletTransactionsTable).values({
        walletId: wallet.id,
        schoolId: order.schoolId,
        type: "debit",
        amount: String(order.finalAmount),
        balanceAfter: String(Math.max(0, newBal)),
        description: `پرداخت سفارش #${order.id}`,
        referenceId: order.id,
      });
    }
  }

  res.json(await enrichOrder(order));
});

router.delete("/book-orders/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(bookOrderItemsTable).where(eq(bookOrderItemsTable.orderId, id));
  await db.delete(bookOrdersTable).where(eq(bookOrdersTable.id, id));
  res.status(204).end();
});

// License summary from paid orders
router.get("/book-license-summary", async (req, res) => {
  const { schoolId, branchId } = req.query as Record<string, string>;
  if (!schoolId) { res.status(400).json({ error: "schoolId required" }); return; }
  const sid = parseInt(schoolId);

  // Purchased: sum quantities from paid order items for this school
  const paidOrders = await db.select({ id: bookOrdersTable.id })
    .from(bookOrdersTable)
    .where(and(eq(bookOrdersTable.schoolId, sid), eq(bookOrdersTable.status, "paid")));
  const paidOrderIds = paidOrders.map(o => o.id);

  const purchased: Record<number, number> = {};
  if (paidOrderIds.length > 0) {
    const itemRows = await db.select().from(bookOrderItemsTable)
      .where(inArray(bookOrderItemsTable.orderId, paidOrderIds));
    for (const row of itemRows) {
      purchased[row.bookId] = (purchased[row.bookId] ?? 0) + row.quantity;
    }
  }

  // Used: distinct students per book across school's classes
  const { branchesTable, gradeLevelsTable, gradesTable, classesTable, classBooksTable, classStudentsTable } = await import("@workspace/db");
  const branchFilter = branchId
    ? [{ id: parseInt(branchId) }]
    : await db.select({ id: branchesTable.id }).from(branchesTable).where(eq(branchesTable.schoolId, sid));
  const branchIds = branchFilter.map((b: { id: number }) => b.id);

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

  const used: Record<number, number> = {};
  const bookStudents: Record<number, Set<number>> = {};
  if (classIds.length > 0) {
    const cbRows = await db.select().from(classBooksTable).where(inArray(classBooksTable.classId, classIds));
    const csRows = await db.select().from(classStudentsTable).where(inArray(classStudentsTable.classId, classIds));
    const classStudentsMap: Record<number, Set<number>> = {};
    for (const cs of csRows) {
      if (!classStudentsMap[cs.classId]) classStudentsMap[cs.classId] = new Set();
      classStudentsMap[cs.classId].add(cs.studentId);
    }
    for (const cb of cbRows) {
      if (!bookStudents[cb.bookId]) bookStudents[cb.bookId] = new Set();
      for (const s of (classStudentsMap[cb.classId] ?? new Set())) bookStudents[cb.bookId].add(s);
    }
  }

  // Also merge direct student_book assignments (deduped with class-based)
  const { studentBooksTable } = await import("@workspace/db");
  const directAssignments = await db.select({ bookId: studentBooksTable.bookId, studentId: studentBooksTable.studentId })
    .from(studentBooksTable)
    .where(and(eq(studentBooksTable.schoolId, sid), eq(studentBooksTable.isActive, true)));
  for (const da of directAssignments) {
    if (!bookStudents[da.bookId]) bookStudents[da.bookId] = new Set();
    bookStudents[da.bookId].add(da.studentId);
  }

  for (const [bid, studs] of Object.entries(bookStudents)) used[Number(bid)] = studs.size;

  const allBookIds = [...new Set([...Object.keys(purchased), ...Object.keys(used)].map(Number))];
  if (allBookIds.length === 0) { res.json([]); return; }

  const books = await db.select().from(booksTable).where(inArray(booksTable.id, allBookIds));
  const bookMap = Object.fromEntries(books.map(b => [b.id, b]));

  res.json(allBookIds.map(bookId => {
    const p = purchased[bookId] ?? 0;
    const u = used[bookId] ?? 0;
    return {
      bookId, bookTitle: bookMap[bookId]?.title ?? `کتاب ${bookId}`,
      purchased: p, used: u, remaining: Math.max(0, p - u),
    };
  }).sort((a, b) => a.bookTitle.localeCompare(b.bookTitle, "fa")));
});

export default router;
