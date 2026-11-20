-- CreateTable
CREATE TABLE "UsoIA" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "imovelId" TEXT,
    "entradaTokens" INTEGER NOT NULL DEFAULT 0,
    "saidaTokens" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsoIA_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsoIA_criadoEm_idx" ON "UsoIA"("criadoEm");
