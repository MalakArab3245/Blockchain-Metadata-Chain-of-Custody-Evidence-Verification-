# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **Charts**: Recharts

## Application: Blockchain Evidence Chain of Custody & Evidence Verification

A forensic-grade evidence management platform for law enforcement and investigators. Maintains immutable, blockchain-verified proof of evidence integrity.

### Features
- Evidence registration with SHA-256 hashing and blockchain tx recording
- Chain of custody transaction logging (immutable, hash-linked)
- Dashboard with stats, charts, and recent activity feed
- Third-party public verification portal (paste-a-hash verification)
- Legal certificate generation for court admissibility
- Evidence vault with filtering and detail views
- Full custody ledger across all cases

### Key Pages
- `/` — Command Center (Dashboard)
- `/evidence` — Evidence Vault (list)
- `/evidence/new` — Submit new evidence
- `/evidence/:id` — Evidence detail, custody chain, certificate
- `/verify` — Public verification portal
- `/custody` — Custody ledger

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Important Notes
- After `pnpm --filter @workspace/api-spec run codegen`, always run: `echo 'export * from "./generated/api";' > lib/api-zod/src/index.ts` to fix duplicate export conflict from orval codegen.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
