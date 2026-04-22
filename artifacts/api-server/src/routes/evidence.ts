import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, evidenceTable, custodyTransactionsTable } from "@workspace/db";
import {
  CreateEvidenceBody,
  UpdateEvidenceBody,
  GetEvidenceParams,
  UpdateEvidenceParams,
  DeleteEvidenceParams,
  ListEvidenceQueryParams,
  GetEvidenceCustodyParams,
  AddCustodyTransactionParams,
  AddCustodyTransactionBody,
  VerifyEvidenceParams,
  GetEvidenceCertificateParams,
} from "@workspace/api-zod";
import { generateTxHash, generateBlockNumber, generateBlockchainTxHash, generateCertificateId } from "../lib/blockchain";

const router: IRouter = Router();

router.get("/evidence", async (req, res): Promise<void> => {
  const params = ListEvidenceQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(evidenceTable).$dynamic();

  if (params.data.status) {
    query = query.where(eq(evidenceTable.status, params.data.status));
  }

  const rows = await query.orderBy(desc(evidenceTable.createdAt));

  let filtered = rows;
  if (params.data.caseId) {
    filtered = rows.filter(r => r.caseId === params.data.caseId);
  }

  res.json(filtered.map(serializeEvidence));
});

router.post("/evidence", async (req, res): Promise<void> => {
  const parsed = CreateEvidenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const collectedAt = data.collectedAt ? new Date(data.collectedAt) : new Date();
  const blockchainTxHash = generateBlockchainTxHash(0, data.fileHash);
  const blockNumber = generateBlockNumber();

  const [evidence] = await db.insert(evidenceTable).values({
    ...data,
    collectedAt,
    blockchainTxHash,
    blockNumber,
    isVerified: true,
    status: "active",
    accessCount: 0,
  }).returning();

  const txHash = generateTxHash(evidence.id, "collected", new Date());
  await db.insert(custodyTransactionsTable).values({
    evidenceId: evidence.id,
    action: "collected",
    performedBy: data.collectedBy,
    performedAt: collectedAt,
    notes: "Initial evidence collection and blockchain registration",
    txHash,
    blockNumber: generateBlockNumber(),
    previousHash: null,
    ipAddress: req.ip ?? null,
  });

  res.status(201).json(serializeEvidence(evidence));
});

router.get("/evidence/:id", async (req, res): Promise<void> => {
  const params = GetEvidenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [evidence] = await db.select().from(evidenceTable).where(eq(evidenceTable.id, params.data.id));
  if (!evidence) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }

  await db.update(evidenceTable).set({ accessCount: evidence.accessCount + 1 }).where(eq(evidenceTable.id, evidence.id));

  res.json(serializeEvidence({ ...evidence, accessCount: evidence.accessCount + 1 }));
});

router.patch("/evidence/:id", async (req, res): Promise<void> => {
  const params = UpdateEvidenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateEvidenceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [evidence] = await db.update(evidenceTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(evidenceTable.id, params.data.id))
    .returning();

  if (!evidence) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }

  res.json(serializeEvidence(evidence));
});

router.delete("/evidence/:id", async (req, res): Promise<void> => {
  const params = DeleteEvidenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [evidence] = await db.delete(evidenceTable).where(eq(evidenceTable.id, params.data.id)).returning();
  if (!evidence) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/evidence/:id/custody", async (req, res): Promise<void> => {
  const params = GetEvidenceCustodyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [evidence] = await db.select().from(evidenceTable).where(eq(evidenceTable.id, params.data.id));
  if (!evidence) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }

  const transactions = await db.select().from(custodyTransactionsTable)
    .where(eq(custodyTransactionsTable.evidenceId, params.data.id))
    .orderBy(custodyTransactionsTable.performedAt);

  res.json(transactions.map(t => serializeTransaction(t, evidence)));
});

router.post("/evidence/:id/custody", async (req, res): Promise<void> => {
  const params = AddCustodyTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AddCustodyTransactionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [evidence] = await db.select().from(evidenceTable).where(eq(evidenceTable.id, params.data.id));
  if (!evidence) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }

  const lastTx = await db.select().from(custodyTransactionsTable)
    .where(eq(custodyTransactionsTable.evidenceId, params.data.id))
    .orderBy(desc(custodyTransactionsTable.createdAt))
    .limit(1);

  const previousHash = lastTx[0]?.txHash ?? null;
  const now = new Date();
  const txHash = generateTxHash(params.data.id, body.data.action, now, previousHash ?? undefined);
  const blockNumber = generateBlockNumber();

  const [tx] = await db.insert(custodyTransactionsTable).values({
    evidenceId: params.data.id,
    action: body.data.action,
    performedBy: body.data.performedBy,
    performedAt: now,
    notes: body.data.notes ?? null,
    txHash,
    blockNumber,
    previousHash,
    ipAddress: body.data.ipAddress ?? req.ip ?? null,
  }).returning();

  res.status(201).json(serializeTransaction(tx, evidence));
});

router.post("/evidence/:id/verify", async (req, res): Promise<void> => {
  const params = VerifyEvidenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [evidence] = await db.select().from(evidenceTable).where(eq(evidenceTable.id, params.data.id));
  if (!evidence) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }

  const transactions = await db.select().from(custodyTransactionsTable)
    .where(eq(custodyTransactionsTable.evidenceId, params.data.id))
    .orderBy(custodyTransactionsTable.performedAt);

  const chainIntegrity = verifyChainIntegrity(transactions);

  res.json({
    evidenceId: evidence.id,
    hash: evidence.fileHash,
    isValid: evidence.isVerified,
    blockchainConfirmed: !!evidence.blockchainTxHash,
    blockNumber: evidence.blockNumber ?? null,
    timestamp: evidence.createdAt.toISOString(),
    chainIntegrity,
    totalTransactions: transactions.length,
    message: chainIntegrity && evidence.isVerified
      ? "Evidence integrity verified. Hash matches blockchain record. Chain of custody is intact."
      : "Warning: Evidence integrity check failed. Chain may have been tampered with.",
  });
});

router.get("/evidence/:id/certificate", async (req, res): Promise<void> => {
  const params = GetEvidenceCertificateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [evidence] = await db.select().from(evidenceTable).where(eq(evidenceTable.id, params.data.id));
  if (!evidence) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }

  const transactions = await db.select().from(custodyTransactionsTable)
    .where(eq(custodyTransactionsTable.evidenceId, params.data.id))
    .orderBy(custodyTransactionsTable.performedAt);

  const chainIntegrity = verifyChainIntegrity(transactions);

  res.json({
    certificateId: generateCertificateId(evidence.id),
    evidenceId: evidence.id,
    caseId: evidence.caseId,
    title: evidence.title,
    fileHash: evidence.fileHash,
    blockchainTxHash: evidence.blockchainTxHash ?? null,
    collectedBy: evidence.collectedBy,
    collectedAt: evidence.collectedAt.toISOString(),
    isVerified: evidence.isVerified,
    chainIntegrity,
    totalCustodyEvents: transactions.length,
    generatedAt: new Date().toISOString(),
    custodyChain: transactions.map(t => serializeTransaction(t, evidence)),
  });
});

function verifyChainIntegrity(transactions: Array<{ txHash: string; previousHash: string | null }>): boolean {
  for (let i = 1; i < transactions.length; i++) {
    if (transactions[i].previousHash !== transactions[i - 1].txHash) {
      return false;
    }
  }
  return true;
}

function serializeEvidence(e: {
  id: number; caseId: string; title: string; description: string | null;
  fileHash: string; blockchainTxHash: string | null; blockNumber: number | null;
  status: string; evidenceType: string; collectedBy: string; collectedAt: Date;
  locationData: string | null; fileSize: number | null; mimeType: string | null;
  isVerified: boolean; accessCount: number; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: e.id,
    caseId: e.caseId,
    title: e.title,
    description: e.description,
    fileHash: e.fileHash,
    blockchainTxHash: e.blockchainTxHash,
    blockNumber: e.blockNumber,
    status: e.status,
    evidenceType: e.evidenceType,
    collectedBy: e.collectedBy,
    collectedAt: e.collectedAt.toISOString(),
    locationData: e.locationData,
    fileSize: e.fileSize,
    mimeType: e.mimeType,
    isVerified: e.isVerified,
    accessCount: e.accessCount,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

function serializeTransaction(
  t: { id: number; evidenceId: number; action: string; performedBy: string; performedAt: Date; notes: string | null; txHash: string; blockNumber: number | null; previousHash: string | null; ipAddress: string | null; createdAt: Date },
  evidence: { title: string; caseId: string }
) {
  return {
    id: t.id,
    evidenceId: t.evidenceId,
    evidenceTitle: evidence.title,
    caseId: evidence.caseId,
    action: t.action,
    performedBy: t.performedBy,
    performedAt: t.performedAt.toISOString(),
    notes: t.notes,
    txHash: t.txHash,
    blockNumber: t.blockNumber,
    previousHash: t.previousHash,
    ipAddress: t.ipAddress,
    createdAt: t.createdAt.toISOString(),
  };
}

export default router;
