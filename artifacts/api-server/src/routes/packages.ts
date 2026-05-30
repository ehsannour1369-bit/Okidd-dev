import { Router } from "express";
import { db, packagesTable, packageBooksTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router = Router();

async function enrichPackage(pkg: typeof packagesTable.$inferSelect) {
  const pbRows = await db.select({ bookId: packageBooksTable.bookId }).from(packageBooksTable).where(eq(packageBooksTable.packageId, pkg.id));
  return {
    ...pkg,
    totalPrice: parseFloat(String(pkg.totalPrice)),
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
  const { bookIds, ...rest } = req.body;
  const [pkg] = await db.insert(packagesTable).values(rest).returning();
  if (bookIds?.length > 0) {
    await db.insert(packageBooksTable).values(bookIds.map((bookId: number) => ({ packageId: pkg.id, bookId })));
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
  const { bookIds, ...rest } = req.body;
  const [pkg] = await db.update(packagesTable).set(rest).where(eq(packagesTable.id, id)).returning();
  if (!pkg) { res.status(404).json({ error: "Not found" }); return; }
  if (bookIds !== undefined) {
    await db.delete(packageBooksTable).where(eq(packageBooksTable.packageId, id));
    if (bookIds.length > 0) {
      await db.insert(packageBooksTable).values(bookIds.map((bookId: number) => ({ packageId: id, bookId })));
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

export default router;
