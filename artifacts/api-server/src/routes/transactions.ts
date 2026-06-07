import { Router } from "express";
import { db, transactionsTable, schoolsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/transactions", async (_req, res) => {
  const rows = await db
    .select({
      id: transactionsTable.id,
      schoolId: transactionsTable.schoolId,
      packageId: transactionsTable.packageId,
      amount: transactionsTable.amount,
      discount: transactionsTable.discount,
      balance: transactionsTable.balance,
      paymentDate: transactionsTable.paymentDate,
      paymentMethod: transactionsTable.paymentMethod,
      notes: transactionsTable.notes,
      status: transactionsTable.status,
      createdAt: transactionsTable.createdAt,
      updatedAt: transactionsTable.updatedAt,
      schoolName: schoolsTable.name,
    })
    .from(transactionsTable)
    .leftJoin(schoolsTable, eq(transactionsTable.schoolId, schoolsTable.id))
    .orderBy(desc(transactionsTable.createdAt));

  res.json(
    rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      discount: Number(r.discount),
      balance: r.balance != null ? Number(r.balance) : null,
      paymentDate: r.paymentDate ? new Date(r.paymentDate).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    })),
  );
});

router.post("/transactions", async (req, res) => {
  const { schoolId, packageId, amount, discount, balance, paymentDate, paymentMethod, notes, status } = req.body;
  if (!schoolId || !packageId || amount == null) {
    res.status(400).json({ error: "schoolId, packageId and amount are required" });
    return;
  }
  const inserted = await db
    .insert(transactionsTable)
    .values({
      schoolId: Number(schoolId),
      packageId: Number(packageId),
      amount: String(amount),
      discount: String(discount ?? 0),
      balance: balance != null ? String(balance) : null,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod ?? "cash",
      notes: notes ?? null,
      status: status ?? "pending",
    })
    .returning();
  res.status(201).json({ ...inserted[0], amount: Number(inserted[0].amount), discount: Number(inserted[0].discount) });
});

router.put("/transactions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { schoolId, packageId, amount, discount, balance, paymentDate, paymentMethod, notes, status } = req.body;
  const updated = await db
    .update(transactionsTable)
    .set({
      ...(schoolId != null && { schoolId: Number(schoolId) }),
      ...(packageId != null && { packageId: Number(packageId) }),
      ...(amount != null && { amount: String(amount) }),
      ...(discount != null && { discount: String(discount) }),
      ...(balance != null && { balance: String(balance) }),
      ...(paymentDate != null && { paymentDate: new Date(paymentDate) }),
      ...(paymentMethod != null && { paymentMethod }),
      ...(notes !== undefined && { notes }),
      ...(status != null && { status }),
    })
    .where(eq(transactionsTable.id, id))
    .returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated[0], amount: Number(updated[0].amount), discount: Number(updated[0].discount) });
});

router.delete("/transactions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
  res.status(204).end();
});

export default router;
