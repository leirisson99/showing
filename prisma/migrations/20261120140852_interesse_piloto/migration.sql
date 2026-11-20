-- CreateTable
CREATE TABLE "InteressePiloto" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteressePiloto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InteressePiloto_email_key" ON "InteressePiloto"("email");
