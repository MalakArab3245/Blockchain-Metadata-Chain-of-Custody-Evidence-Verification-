import { Router, type IRouter } from "express";
import { desc, eq, sql, count } from "drizzle-orm";
import { db, evidenceTable, custodyTransactionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [evidenceStats] = await db.select({
    total: count(evidenceTable.id),
  }).from(evidenceTable);

  const [verifiedStats] = await db.select({
    count: count(evidenceTable.id),
  }).from(evidenceTable).where(eq(evidenceTable.isVerified, true));

  const [pendingStats] = await db.select({
    count: count(evidenceTable.id),
  }).from(evidenceTable).where(eq(evidenceTable.status, "active"));

  const caseIds = await db.selectDistinct({ caseId: evidenceTable.caseId }).from(evidenceTable);
  const totalCases = caseIds.length;

  const [txStats] = await db.select({
    total: count(custodyTransactionsTable.id),
  }).from(custodyTransactionsTable);

  const byType = await db.select({
    label: evidenceTable.evidenceType,
    count: count(evidenceTable.id),
  }).from(evidenceTable).groupBy(evidenceTable.evidenceType);

  const byStatus = await db.select({
    label: evidenceTable.status,
    count: count(evidenceTable.id),
  }).from(evidenceTable).groupBy(evidenceTable.status);

  const total = evidenceStats?.total ?? 0;
  const verified = verifiedStats?.count ?? 0;
  const integrityRate = total > 0 ? Math.round((verified / total) * 100) : 100;

  res.json({
    totalEvidence: total,
    verifiedEvidence: verified,
    pendingEvidence: pendingStats?.count ?? 0,
    totalCases,
    totalTransactions: txStats?.total ?? 0,
    integrityRate,
    evidenceByType: byType.map(r => ({ label: r.label, count: Number(r.count) })),
    evidenceByStatus: byStatus.map(r => ({ label: r.label, count: Number(r.count) })),
  });
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const transactions = await db
    .select({
      id: custodyTransactionsTable.id,
      evidenceId: custodyTransactionsTable.evidenceId,
      evidenceTitle: evidenceTable.title,
      caseId: evidenceTable.caseId,
      action: custodyTransactionsTable.action,
      performedBy: custodyTransactionsTable.performedBy,
      performedAt: custodyTransactionsTable.performedAt,
      notes: custodyTransactionsTable.notes,
      txHash: custodyTransactionsTable.txHash,
      blockNumber: custodyTransactionsTable.blockNumber,
      previousHash: custodyTransactionsTable.previousHash,
      ipAddress: custodyTransactionsTable.ipAddress,
      createdAt: custodyTransactionsTable.createdAt,
    })
    .from(custodyTransactionsTable)
    .innerJoin(evidenceTable, eq(custodyTransactionsTable.evidenceId, evidenceTable.id))
    .orderBy(desc(custodyTransactionsTable.performedAt))
    .limit(20);

  res.json(transactions.map(t => ({
    ...t,
    performedAt: t.performedAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
  })));
});

export default router;
