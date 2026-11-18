-- CreateEnum
CREATE TYPE "TipoImovel" AS ENUM ('apartamento', 'casa', 'terreno', 'sala_comercial');

-- CreateEnum
CREATE TYPE "Finalidade" AS ENUM ('venda', 'aluguel');

-- CreateEnum
CREATE TYPE "StatusImovel" AS ENUM ('rascunho', 'publicado', 'vendido');

-- CreateEnum
CREATE TYPE "StatusConversa" AS ENUM ('ativa', 'encerrada');

-- CreateEnum
CREATE TYPE "StatusVisita" AS ENUM ('pedida', 'confirmada', 'realizada', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('visualizacao', 'chat_aberto', 'chat_mensagem', 'contato_capturado', 'visita_pedida', 'transferencia');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "creci" TEXT,
    "whatsapp" TEXT,
    "fotoFileId" TEXT,
    "horariosVisita" JSONB NOT NULL DEFAULT '{}',
    "duracaoVisitaMin" INTEGER NOT NULL DEFAULT 60,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Imovel" (
    "id" TEXT NOT NULL,
    "corretorId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tipo" "TipoImovel" NOT NULL,
    "finalidade" "Finalidade" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL DEFAULT 'Blumenau',
    "endereco" TEXT,
    "mostrarEndereco" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "preco" DECIMAL(14,2) NOT NULL,
    "condominio" DECIMAL(12,2),
    "iptu" DECIMAL(12,2),
    "quartos" INTEGER NOT NULL,
    "suites" INTEGER,
    "banheiros" INTEGER NOT NULL,
    "vagas" INTEGER NOT NULL,
    "areaM2" DECIMAL(10,2) NOT NULL,
    "aceitaFinanciamento" BOOLEAN NOT NULL,
    "aceitaFgts" BOOLEAN,
    "caracteristicas" TEXT[],
    "infoAdicional" TEXT,
    "status" "StatusImovel" NOT NULL DEFAULT 'rascunho',
    "publicadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Imovel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "legenda" TEXT,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversa" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "mensagens" JSONB NOT NULL DEFAULT '[]',
    "perfilLead" JSONB,
    "consentimento" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoEm" TIMESTAMP(3),
    "transferida" BOOLEAN NOT NULL DEFAULT false,
    "motivoTransferencia" TEXT,
    "status" "StatusConversa" NOT NULL DEFAULT 'ativa',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visita" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "status" "StatusVisita" NOT NULL DEFAULT 'pedida',
    "observacao" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "conversaId" TEXT,
    "tipo" "TipoEvento" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Imovel_slug_key" ON "Imovel"("slug");

-- CreateIndex
CREATE INDEX "Imovel_corretorId_idx" ON "Imovel"("corretorId");

-- CreateIndex
CREATE INDEX "Imovel_status_idx" ON "Imovel"("status");

-- CreateIndex
CREATE INDEX "Foto_imovelId_ordem_idx" ON "Foto"("imovelId", "ordem");

-- CreateIndex
CREATE INDEX "Conversa_imovelId_idx" ON "Conversa"("imovelId");

-- CreateIndex
CREATE UNIQUE INDEX "Visita_conversaId_key" ON "Visita"("conversaId");

-- CreateIndex
CREATE INDEX "Visita_imovelId_dataHora_idx" ON "Visita"("imovelId", "dataHora");

-- CreateIndex
CREATE INDEX "Evento_imovelId_tipo_idx" ON "Evento"("imovelId", "tipo");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imovel" ADD CONSTRAINT "Imovel_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversa" ADD CONSTRAINT "Conversa_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
