import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { evidenceTable } from "./evidence";

export const custodyTransactionsTable = pgTable("custody_transactions", {
  id: serial("id").primaryKey(),
  evidenceId: integer("evidence_id").notNull().references(() => evidenceTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  performedBy: text("performed_by").notNull(),
  performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
  txHash: text("tx_hash").notNull(),
  blockNumber: integer("block_number"),
  previousHash: text("previous_hash"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCustodyTransactionSchema = createInsertSchema(custodyTransactionsTable).omit({
  id: true,
  createdAt: true,
  txHash: true,
  blockNumber: true,
  previousHash: true,
});
export type InsertCustodyTransaction = z.infer<typeof insertCustodyTransactionSchema>;
export type CustodyTransaction = typeof custodyTransactionsTable.$inferSelect;
