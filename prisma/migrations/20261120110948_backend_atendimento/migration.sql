-- AlterTable
ALTER TABLE "Conversa" ADD COLUMN     "lidaEm" TIMESTAMP(3),
ADD COLUMN     "versao" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
-- corretorId nasce nulo, é preenchido a partir do imóvel e só então vira obrigatório.
ALTER TABLE "Visita" ADD COLUMN     "corretorId" TEXT;
UPDATE "Visita" v SET "corretorId" = i."corretorId" FROM "Imovel" i WHERE i."id" = v."imovelId";
ALTER TABLE "Visita" ALTER COLUMN "corretorId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Conversa_imovelId_transferida_idx" ON "Conversa"("imovelId", "transferida");

-- CreateIndex
CREATE INDEX "Evento_imovelId_criadoEm_idx" ON "Evento"("imovelId", "criadoEm");

-- CreateIndex
CREATE INDEX "Visita_corretorId_dataHora_idx" ON "Visita"("corretorId", "dataHora");

-- AddForeignKey
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Um corretor não pode ter duas visitas ativas no mesmo horário (RN-17). Prisma não declara
-- índice parcial; fica só aqui. Visita cancelada libera o horário.
CREATE UNIQUE INDEX "Visita_corretor_horario_ativo_key" ON "Visita"("corretorId", "dataHora") WHERE "status" <> 'cancelada';
