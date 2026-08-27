import { PrismaClient } from "@prisma/client";
import { DEFAULT_KNOWLEDGE_BASE } from "../src/lib/config/defaults";

const prisma = new PrismaClient();

async function main() {
  console.log("Semeando base de conhecimento padrão da Fast EPS...");

  for (const [key, value] of Object.entries(DEFAULT_KNOWLEDGE_BASE)) {
    await prisma.knowledgeConfig.upsert({
      where: { key },
      create: { key, value: value as object, updatedBy: "seed" },
      // Não sobrescreve o que já foi customizado pelo painel administrativo.
      update: {},
    });
  }

  console.log("Base de conhecimento pronta.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
