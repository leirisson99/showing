import type { Metadata } from "next";
import { ListaConversas, type ItemConversa } from "@/components/painel/ListaConversas";
import { formatarDataHora, formatarTelefone } from "@/lib/format";
import { listarConversas } from "@/lib/painel/atendimentos";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Conversas — Showing", robots: { index: false } };

export default async function ConversasPage() {
  const corretor = await exigirCorretor();
  const conversas = await listarConversas(corretor.id);

  // As transferidas vêm primeiro: são as que esperam uma resposta sua.
  const ordenadas = [...conversas].sort((a, b) => Number(b.transferida) - Number(a.transferida));

  const itens: ItemConversa[] = ordenadas.map((c) => ({
    id: c.id,
    quando: formatarDataHora(c.atualizadaEm),
    imovelTitulo: c.imovelTitulo,
    nome: c.lead?.nome ?? null,
    contato: c.lead?.telefone ? formatarTelefone(c.lead.telefone) : (c.lead?.email ?? null),
    totalMensagens: c.totalMensagens,
    transferida: c.transferida,
    motivo: c.motivoTransferencia,
    visita: c.visita ? { status: c.visita.status, quando: formatarDataHora(c.visita.dataHora) } : null,
  }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">Conversas</h1>
        <p className="mt-1 text-muted-foreground">
          Conversas do atendente com os compradores. Nome e contato só aparecem se o comprador autorizou.
        </p>
      </div>
      <ListaConversas itens={itens} />
    </main>
  );
}
