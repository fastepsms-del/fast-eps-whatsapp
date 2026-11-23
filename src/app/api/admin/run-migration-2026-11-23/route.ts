import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota de uso único: aplica manualmente no banco de produção
 * (via `db push` histórico, sem baseline de `prisma migrate`):
 * - Garante o enum PipelineStage com os valores atuais (SDR, CLOSER,
 *   ORCAMENTO_ENVIADO, PAGAMENTO, ENTREGA, POS_VENDA), renomeando os
 *   valores antigos (PROSPECCAO/ORCAMENTO) se a rota de 2026-11-11 já
 *   tiver criado o tipo antes.
 * - Garante as colunas assignedToName/pipelineStage em "leads".
 * - Cria a tabela "api_keys".
 * Protegida pelo middleware admin. Idempotente. Remover depois de
 * confirmar que funcionou.
 */
export async function GET(): Promise<NextResponse> {
  const statements = [
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PipelineStage') THEN
         CREATE TYPE "PipelineStage" AS ENUM ('SDR', 'CLOSER', 'ORCAMENTO_ENVIADO', 'PAGAMENTO', 'ENTREGA', 'POS_VENDA');
       END IF;
     END $$;`,
    `DO $$ BEGIN
       EXECUTE $sql$ALTER TYPE "PipelineStage" RENAME VALUE 'PROSPECCAO' TO 'SDR'$sql$;
     EXCEPTION WHEN OTHERS THEN NULL; END $$;`,
    `DO $$ BEGIN
       EXECUTE $sql$ALTER TYPE "PipelineStage" RENAME VALUE 'ORCAMENTO' TO 'CLOSER'$sql$;
     EXCEPTION WHEN OTHERS THEN NULL; END $$;`,
    `DO $$ BEGIN
       EXECUTE $sql$ALTER TYPE "PipelineStage" ADD VALUE IF NOT EXISTS 'ORCAMENTO_ENVIADO'$sql$;
     EXCEPTION WHEN OTHERS THEN NULL; END $$;`,
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "assignedToName" TEXT;`,
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "pipelineStage" "PipelineStage";`,
    `CREATE TABLE IF NOT EXISTS "api_keys" (
       "id" TEXT PRIMARY KEY,
       "label" TEXT NOT NULL,
       "keyHash" TEXT NOT NULL UNIQUE,
       "keyPrefix" TEXT NOT NULL,
       "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
       "createdBy" TEXT,
       "lastUsedAt" TIMESTAMP,
       "revokedAt" TIMESTAMP
     );`,
  ];

  const results: string[] = [];
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${sql.replace(/\s+/g, " ").slice(0, 90)}`);
    } catch (error) {
      results.push(`ERRO: ${sql.replace(/\s+/g, " ").slice(0, 90)} -> ${String(error)}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
