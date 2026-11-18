import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const corretor = await db.user.upsert({
    where: { email: "corretor@exemplo.com" },
    update: {},
    create: {
      email: "corretor@exemplo.com",
      name: "Corretor de Exemplo",
      creci: "CRECI-SC 00000",
      horariosVisita: { sab: ["09:00", "10:00", "11:00"], dom: ["10:00"] },
    },
  });

  await db.imovel.upsert({
    where: { slug: "apartamento-2-quartos-victor-konder-blumenau" },
    update: {},
    create: {
      corretorId: corretor.id,
      slug: "apartamento-2-quartos-victor-konder-blumenau",
      tipo: "apartamento",
      finalidade: "venda",
      titulo: "Apartamento de 2 quartos no Victor Konder",
      descricao: "Apartamento de exemplo para desenvolvimento.",
      bairro: "Victor Konder",
      cidade: "Blumenau",
      preco: 480000,
      quartos: 2,
      banheiros: 1,
      vagas: 1,
      areaM2: 68,
      aceitaFinanciamento: true,
      caracteristicas: ["sacada com churrasqueira"],
      status: "publicado",
      publicadoEm: new Date(),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
