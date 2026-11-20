import { contarNaoLidas } from "@/lib/painel/atendimentos";
import { exigirCorretor } from "@/lib/session";
import { NavPainel } from "./NavPainel";

// Lê a sessão e o número de conversas esperando resposta; o menu em si é um componente
// de cliente (marca a página ativa).
export async function NavPainelComContador() {
  const corretor = await exigirCorretor();
  return <NavPainel pendentes={await contarNaoLidas(corretor.id)} />;
}
