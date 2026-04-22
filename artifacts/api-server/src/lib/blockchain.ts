import { createHash } from "crypto";

export function computeSHA256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function generateTxHash(evidenceId: number, action: string, timestamp: Date, previousHash?: string): string {
  const payload = `${evidenceId}:${action}:${timestamp.toISOString()}:${previousHash ?? "genesis"}`;
  return "0x" + computeSHA256(payload);
}

export function generateBlockNumber(): number {
  return Math.floor(19000000 + Math.random() * 2000000);
}

export function generateCertificateId(evidenceId: number): string {
  const ts = Date.now();
  const raw = computeSHA256(`cert:${evidenceId}:${ts}`).slice(0, 12).toUpperCase();
  return `CERT-${raw}`;
}

export function generateBlockchainTxHash(evidenceId: number, fileHash: string): string {
  return "0x" + computeSHA256(`blockchain:${evidenceId}:${fileHash}:${Date.now()}`);
}
