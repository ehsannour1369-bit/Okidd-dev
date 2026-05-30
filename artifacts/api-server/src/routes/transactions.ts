import { Router } from "express";
import { db, transactionsTable, schoolsTable, packagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function formatTx(tx: typeof transactionsTable.$inferSelect, schoolName?: string | null, packageName?: string | null) {
  return {
    ...tx,
    amount: parseFloat(String(tx.amount)),
    discount: parseFloat(String(tx.discount)),
    balance: tx.balance !== null ? parseFloat(String(tx.balance)) : null,
    paymentDate: tx.paymentDate instanceof Date ? tx.paymentDate.toISOString() : String(tx.paymentDate),
    schoolName: schoolName ?? null,
    packageName: packageName ?? null,
  };
}

router.get("/transactions", async (req, res) => {
  const { schoolId, status } = req.query as Record<string, string>;
  let rows = await db.select().from(transactionsTable);
  if (schoolId) rows = rows.filter(t => t.schoolId === parseInt(schoolId));
  if (status) rows = rows.filter(t => t.status === status);
  const schools = await db.select().from(schoolsTable);
  const packages = await db.select().from(packagesTable);
  const schoolMap = Object.fromEntries(schools.map(s => [s.id, s.name]));
  const packageMap = Object.fromEntries(packages.map(p => [p.id, p.title]));
  res.json(rows.map(t => formatTx(t, schoolMap[t.schoolId], packageMap[t.packageId])));
});

router.post("/transactions", async (req, res) => {
  const [tx] = await db.insert(transactionsTable).values(req.body).returning();
  // Auto-activate school when a transaction is recorded with "paid" status
  if (req.body.status === "paid" && req.body.schoolId) {
    await db.update(schoolsTable).set({ status: "active" }).where(eq(schoolsTable.id, req.body.schoolId));
  }
  res.status(201).json(formatTx(tx));
});

router.put("/transactions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [tx] = await db.update(transactionsTable).set(req.body).where(eq(transactionsTable.id, id)).returning();
  if (!tx) { res.status(404).json({ error: "Not found" }); return; }
  // Auto-activate school if status changed to paid
  if (req.body.status === "paid" && tx.schoolId) {
    await db.update(schoolsTable).set({ status: "active" }).where(eq(schoolsTable.id, tx.schoolId));
  }
  res.json(formatTx(tx));
});

router.delete("/transactions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
  res.status(204).end();
});

export default router;
