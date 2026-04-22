import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, custodyTransactionsTable, evidenceTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/custody", async (_req, res): Promise<void> => {
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
    .orderBy(desc(custodyTransactionsTable.performedAt));

  res.json(transactions.map(t => ({
    ...t,
    performedAt: t.performedAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
  })));
});

export default router;
