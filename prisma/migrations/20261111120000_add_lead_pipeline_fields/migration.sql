-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('PROSPECCAO', 'ORCAMENTO', 'PAGAMENTO', 'ENTREGA', 'POS_VENDA');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "assignedToName" TEXT,
ADD COLUMN     "pipelineStage" "PipelineStage";
