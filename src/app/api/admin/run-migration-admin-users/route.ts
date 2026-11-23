import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota de uso único: cria a tabela de atendentes ("admin_users") e o enum
 * "AdminRole" no banco de produção (que nunca usou `prisma migrate`).
 * Só administradores acessam (o middleware bloqueia atendentes). Idempotente.
 * Pode ser removida depois de rodar.
 */
export async function GET(): Promise<NextResponse> {
  const statements = [
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminRole') THEN
         CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'ATTENDANT');
       END IF;
     END $$;`,
    `CREATE TABLE IF NOT EXISTS "admin_users" (
       "id" TEXT PRIMARY KEY,
       "username" TEXT NOT NULL UNIQUE,
       "displayName" TEXT NOT NULL,
       "passwordHash" TEXT NOT NULL,
       "role" "AdminRole" NOT NULL DEFAULT 'ATTENDANT',
       "active" BOOLEAN NOT NULL DEFAULT true,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
       "lastLoginAt" TIMESTAMP(3)
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

  return NextResponse.json({ ok: !results.some((r) => r.startsWith("ERRO")), results });
}
