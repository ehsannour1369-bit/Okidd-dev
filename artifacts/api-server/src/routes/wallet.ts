import { Router } from "express";
import { db, walletsTable, walletTransactionsTable, schoolsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

async function getOrCreateWallet(schoolId: number) {
  const [existing] = await db.select().from(walletsTable).where(eq(walletsTable.schoolId, schoolId));
  if (existing) return existing;
  const [created] = await db.insert(walletsTable).values({ schoolId, balance: "0" }).returning();
  return created;
}

router.get("/wallets/:schoolId", async (req, res) => {
  const schoolId = parseInt(req.params.schoolId);
  const wallet = await getOrCreateWallet(schoolId);
  const txs = await db.select().from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.schoolId, schoolId))
    .orderBy(desc(walletTransactionsTable.createdAt));
  res.json({
    ...wallet,
    balance: parseFloat(String(wallet.balance)),
    transactions: txs.map(t => ({ ...t, amount: parseFloat(String(t.amount)), balanceAfter: parseFloat(String(t.balanceAfter)) })),
  });
});

// Admin: credit wallet (add funds)
router.post("/wallets/:schoolId/credit", async (req, res) => {
  const schoolId = parseInt(req.params.schoolId);
  const { amount, description } = req.body as { amount: number; description?: string };
  if (!amount || amount <= 0) { res.status(400).json({ error: "مبلغ معتبر وارد کنید" }); return; }

  const wallet = await getOrCreateWallet(schoolId);
  const newBalance = parseFloat(String(wallet.balance)) + amount;
  await db.update(walletsTable).set({ balance: String(newBalance) }).where(eq(walletsTable.id, wallet.id));
  const [tx] = await db.insert(walletTransactionsTable).values({
    walletId: wallet.id, schoolId, type: "credit",
    amount: String(amount), balanceAfter: String(newBalance),
    description: description ?? "شارژ کیف پول",
  }).returning();
  res.status(201).json({ ...tx, amount: parseFloat(String(tx.amount)), balanceAfter: parseFloat(String(tx.balanceAfter)) });
});

// Debit wallet (e.g. to pay for an order)
router.post("/wallets/:schoolId/debit", async (req, res) => {
  const schoolId = parseInt(req.params.schoolId);
  const { amount, description, referenceId } = req.body as { amount: number; description?: string; referenceId?: number };
  if (!amount || amount <= 0) { res.status(400).json({ error: "مبلغ معتبر وارد کنید" }); return; }

  const wallet = await getOrCreateWallet(schoolId);
  const currentBal = parseFloat(String(wallet.balance));
  if (currentBal < amount) {
    res.status(400).json({ error: `موجودی کافی نیست. موجودی فعلی: ${currentBal.toLocaleString("fa")} تومان` });
    return;
  }
  const newBalance = currentBal - amount;
  await db.update(walletsTable).set({ balance: String(newBalance) }).where(eq(walletsTable.id, wallet.id));
  const [tx] = await db.insert(walletTransactionsTable).values({
    walletId: wallet.id, schoolId, type: "debit",
    amount: String(amount), balanceAfter: String(newBalance),
    description: description ?? "برداشت از کیف پول",
    referenceId: referenceId ?? null,
  }).returning();
  res.status(201).json({ ...tx, amount: parseFloat(String(tx.amount)), balanceAfter: parseFloat(String(tx.balanceAfter)) });
});

export default router;
