import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { ListaConversas, type ItemConversa } from "@/components/painel/ListaConversas";
import { formatarDataHora, formatarTelefone } from "@/lib/format";
import { listarConversas } from "@/lib/painel/atendimentos";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Conversas — Showing", robots: { index: false } };

export default async function ConversasPage() {
  const corretor = await exigirCorretor();
  const conversas = await listarConversas(corretor.id);

  // As que esperam resposta vêm primeiro (RF-10); depois, as mais recentes.
  const ordenadas = [...conversas].sort((a, b) => Number(b.naoLida) - Number(a.naoLida) || b.atualizadaEm.getTime() - a.atualizadaEm.getTime());

  const itens: ItemConversa[] = ordenadas.map((c) => ({
    id: c.id,
    quando: formatarDataHora(c.atualizadaEm),
    imovelTitulo: c.imovelTitulo,
    nome: c.lead?.nome ?? null,
    contato: c.lead?.telefone ? formatarTelefone(c.lead.telefone) : (c.lead?.email ?? null),
    ultimaMensagem: c.ultimaMensagem,
    totalMensagens: c.totalMensagens,
    transferida: c.transferida,
    naoLida: c.naoLida,
    motivo: c.motivoTransferencia,
    visita: c.visita ? { status: c.visita.status, quando: formatarDataHora(c.visita.dataHora) } : null,
  }));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <CabecalhoPagina
        rotulo="Atendimento"
        titulo="Conversas"
        descricao="Conversas do atendente com os compradores. Nome e contato só aparecem se o comprador autorizou."
      />
      <ListaConversas itens={itens} />
    </main>
  );
}
