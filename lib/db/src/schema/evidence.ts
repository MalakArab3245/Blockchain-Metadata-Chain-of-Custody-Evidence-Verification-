import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const evidenceTable = pgTable("evidence", {
  id: serial("id").primaryKey(),
  caseId: text("case_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileHash: text("file_hash").notNull(),
  blockchainTxHash: text("blockchain_tx_hash"),
  blockNumber: integer("block_number"),
  status: text("status").notNull().default("active"),
  evidenceType: text("evidence_type").notNull(),
  collectedBy: text("collected_by").notNull(),
  collectedAt: timestamp("collected_at", { withTimezone: true }).notNull(),
  locationData: text("location_data"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  isVerified: boolean("is_verified").notNull().default(false),
  accessCount: integer("access_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEvidenceSchema = createInsertSchema(evidenceTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  accessCount: true,
  isVerified: true,
});
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type Evidence = typeof evidenceTable.$inferSelect;
