import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, evidenceTable, custodyTransactionsTable } from "@workspace/db";
import { VerifyHashBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/verify/hash", async (req, res): Promise<void> => {
  const body = VerifyHashBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { hash } = body.data;

  const [evidence] = await db.select().from(evidenceTable).where(eq(evidenceTable.fileHash, hash));

  if (!evidence) {
    res.json({
      evidenceId: null,
      hash,
      isValid: false,
      blockchainConfirmed: false,
      blockNumber: null,
      timestamp: new Date().toISOString(),
      chainIntegrity: false,
      totalTransactions: 0,
      message: "Hash not found in blockchain registry. This evidence has not been registered or may have been tampered with.",
    });
    return;
  }

  const transactions = await db.select().from(custodyTransactionsTable)
    .where(eq(custodyTransactionsTable.evidenceId, evidence.id))
    .orderBy(custodyTransactionsTable.performedAt);

  let chainIntegrity = true;
  for (let i = 1; i < transactions.length; i++) {
    if (transactions[i].previousHash !== transactions[i - 1].txHash) {
      chainIntegrity = false;
      break;
    }
  }

  res.json({
    evidenceId: evidence.id,
    hash,
    isValid: evidence.isVerified,
    blockchainConfirmed: !!evidence.blockchainTxHash,
    blockNumber: evidence.blockNumber ?? null,
    timestamp: evidence.createdAt.toISOString(),
    chainIntegrity,
    totalTransactions: transactions.length,
    message: chainIntegrity && evidence.isVerified
      ? `Evidence verified. Registered in block #${evidence.blockNumber}. Chain of custody contains ${transactions.length} events.`
      : "Warning: Evidence integrity check failed.",
  });
});

export default router;
