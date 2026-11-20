import "dotenv/config";
import { retencaoDias } from "../src/lib/lgpd";
import { aplicarRetencao } from "../src/lib/retencao";

// pnpm retencao — anonimiza as conversas sem atividade há mais de RETENCAO_DIAS dias.
async function main() {
  const { anonimizadas } = await aplicarRetencao();
  console.log(`Prazo de ${retencaoDias()} dias: ${anonimizadas} conversa(s) anonimizada(s).`);
  process.exit(0);
}
main().catch((e) => {
  console.error("Falha:", e instanceof Error ? e.name : "erro");
  process.exit(1);
});
