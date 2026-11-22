-- AlterTable
ALTER TABLE "UsoIA" ADD COLUMN     "corretorId" TEXT;

-- CreateIndex
CREATE INDEX "UsoIA_corretorId_idx" ON "UsoIA"("corretorId");
