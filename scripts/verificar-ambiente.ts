import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// pnpm env:check — confere variáveis, banco, migrations e seed. Não imprime valores.
// Sai com código 1 se faltar algo obrigatório (grupo "base").

type Grupo = { nome: string; obrigatorio: boolean; vars: string[]; efeito: string };

const GRUPOS: Grupo[] = [
  { nome: "base", obrigatorio: true, vars: ["DATABASE_URL", "AUTH_SECRET"], efeito: "sem isto não há banco nem login" },
  { nome: "site", obrigatorio: false, vars: ["NEXT_PUBLIC_SITE_URL"], efeito: "sem isto links, sitemap e e-mails usam o padrão local" },
  { nome: "IA", obrigatorio: false, vars: ["AI_API_KEY", "AI_MODEL"], efeito: "sem isto a bolha usa o atendente simulado" },
  { nome: "e-mail", obrigatorio: false, vars: ["EMAIL_USER", "EMAIL_APP_PASSWORD"], efeito: "sem isto não há link de login nem notificações" },
  { nome: "fotos", obrigatorio: false, vars: ["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "APPWRITE_BUCKET_ID"], efeito: "sem isto o envio de fotos só funciona com USAR_MOCKS=1" },
];

let falhou = false;
const ok = (m: string) => console.log(`  ok    ${m}`);
const aviso = (m: string) => console.log(`  falta ${m}`);
const erro = (m: string) => {
  falhou = true;
  console.log(`  ERRO  ${m}`);
};

async function main() {
  console.log("Variáveis");
  for (const g of GRUPOS) {
    const faltando = g.vars.filter((v) => !process.env[v]?.trim());
    if (faltando.length === 0) ok(g.nome);
    else if (g.obrigatorio) erro(`${g.nome}: ${faltando.join(", ")} (${g.efeito})`);
    else aviso(`${g.nome}: ${faltando.join(", ")} (${g.efeito})`);
  }
  if (process.env.USAR_MOCKS === "1") aviso("USAR_MOCKS=1: painel sem login e dados em memória; remova para usar o banco");

  console.log("Banco");
  if (!process.env.DATABASE_URL) return;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    await db.$queryRaw`SELECT 1`;
    ok("conexão");
    const pendentes = await db.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM _prisma_migrations WHERE finished_at IS NULL`;
    if (Number(pendentes[0].n) === 0) ok("migrations aplicadas");
    else erro("há migration não concluída: rode pnpm prisma migrate deploy");
    const corretores = await db.user.count();
    const imoveis = await db.imovel.count({ where: { status: "publicado" } });
    if (corretores > 0 && imoveis > 0) ok(`seed: ${corretores} corretor(es), ${imoveis} imóvel(is) publicado(s)`);
    else erro("sem dados de exemplo: rode pnpm prisma db seed");
  } catch (e) {
    erro(`banco inacessível ou sem migrations (${e instanceof Error ? e.name : "erro"}): suba o Postgres e rode pnpm prisma migrate deploy`);
  } finally {
    await db.$disconnect();
  }
}

main().then(() => {
  console.log(falhou ? "\nAmbiente com problemas." : "\nAmbiente pronto.");
  process.exit(falhou ? 1 : 0);
});
