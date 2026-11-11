import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota de uso único: aplica manualmente as colunas de etiquetagem
 * (assignedToName/pipelineStage) no banco de produção, já que este projeto
 * nunca usou `prisma migrate` (o schema foi aplicado via `db push` em algum
 * momento no passado, então `prisma migrate deploy` falha com
 * "db_schema_not_empty" por não ter um baseline). Protegida pelo middleware
 * admin (precisa estar logado em /admin). Idempotente — pode ser chamada
 * mais de uma vez sem erro. Remover esta rota depois de confirmar que
 * funcionou.
 */
export async function GET(): Promise<NextResponse> {
  const statements = [
    `DO $$ BEGIN
       CREATE TYPE "PipelineStage" AS ENUM ('PROSPECCAO', 'ORCAMENTO', 'PAGAMENTO', 'ENTREGA', 'POS_VENDA');
     EXCEPTION WHEN duplicate_object THEN null;
     END $$;`,
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "assignedToName" TEXT;`,
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "pipelineStage" "PipelineStage";`,
  ];

  const results: string[] = [];
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${sql.replace(/\s+/g, " ").slice(0, 70)}`);
    } catch (error) {
      results.push(`ERRO: ${sql.replace(/\s+/g, " ").slice(0, 70)} -> ${String(error)}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
