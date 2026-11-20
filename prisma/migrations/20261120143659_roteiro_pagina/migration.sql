-- CreateTable
CREATE TABLE "RoteiroPagina" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "conteudo" JSONB NOT NULL,
    "relatorio" JSONB NOT NULL,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoteiroPagina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoteiroPagina_imovelId_aprovado_idx" ON "RoteiroPagina"("imovelId", "aprovado");

-- CreateIndex
CREATE UNIQUE INDEX "RoteiroPagina_imovelId_versao_key" ON "RoteiroPagina"("imovelId", "versao");

-- AddForeignKey
ALTER TABLE "RoteiroPagina" ADD CONSTRAINT "RoteiroPagina_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
