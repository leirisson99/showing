import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { custoEstimado, limiteDiario } from "../src/lib/ai/uso";

// pnpm custo [dias] — uso do modelo de IA por semana (padrão: últimos 28 dias). Só contagens.
// Preço em US$ por 1 milhão de tokens: AI_PRECO_ENTRADA e AI_PRECO_SAIDA (veja o modelo em openrouter.ai/models).
async function main() {
  const dias = Number(process.argv[2]) > 0 ? Number(process.argv[2]) : 28;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
    const linhas = await db.usoIA.findMany({ where: { criadoEm: { gte: desde } }, orderBy: { criadoEm: "asc" } });

    const semanas = new Map<string, { chat: number; descricao: number; entrada: number; saida: number }>();
    for (const l of linhas) {
      const d = new Date(l.criadoEm);
      d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // domingo da semana
      const chave = d.toISOString().slice(0, 10);
      const s = semanas.get(chave) ?? { chat: 0, descricao: 0, entrada: 0, saida: 0 };
      if (l.tipo === "chat") s.chat++;
      else s.descricao++;
      s.entrada += l.entradaTokens;
      s.saida += l.saidaTokens;
      semanas.set(chave, s);
    }

    console.log(`Modelo: ${process.env.AI_MODEL ?? "(não definido)"} · últimos ${dias} dias · limite diário: ${limiteDiario()} mensagens\n`);
    console.log("Semana (domingo)  Mensagens  Descrições  Tokens entrada  Tokens saída  US$ estimado");
    let total = { entrada: 0, saida: 0, chat: 0 };
    for (const [semana, s] of [...semanas].sort()) {
      const custo = custoEstimado({ entrada: s.entrada, saida: s.saida });
      console.log(`${semana}  ${String(s.chat).padStart(9)}  ${String(s.descricao).padStart(10)}  ${String(s.entrada).padStart(14)}  ${String(s.saida).padStart(12)}  ${custo === null ? "defina AI_PRECO_*" : custo.toFixed(4)}`);
      total = { entrada: total.entrada + s.entrada, saida: total.saida + s.saida, chat: total.chat + s.chat };
    }
    const custoTotal = custoEstimado(total);
    console.log(`\nTotal: ${total.chat} mensagens, ${total.entrada + total.saida} tokens${custoTotal === null ? "" : `, US$ ${custoTotal.toFixed(4)}`}`);
    if (total.chat > 0) {
      console.log(`Médias por mensagem: ${Math.round(total.entrada / total.chat)} tokens de entrada e ${Math.round(total.saida / total.chat)} de saída${custoTotal === null ? "" : `, US$ ${(custoTotal / total.chat).toFixed(5)}`}`);
    }
    if (linhas.length === 0) console.log("Nenhum uso registrado ainda neste período.");
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error("Falha:", e instanceof Error ? e.name : "erro");
  process.exit(1);
});
